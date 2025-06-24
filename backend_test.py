import requests
import uuid
import time
import sys
from datetime import datetime

class NetflixAPITester:
    def __init__(self, base_url):
        self.base_url = base_url + "/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None
        self.profile_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )

    def test_register(self):
        """Test user registration"""
        # Generate unique email to avoid conflicts
        timestamp = int(time.time())
        email = f"test_user_{timestamp}@example.com"
        
        self.user_data = {
            "email": email,
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User",
            "subscription_plan": "premium"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=self.user_data
        )
        
        if success:
            print(f"Created user with email: {email}")
        
        return success, response

    def test_login(self):
        """Test login and get token"""
        if not self.user_data:
            print("❌ No user data available for login test")
            return False, {}
            
        login_data = {
            "email": self.user_data["email"],
            "password": self.user_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"Got access token: {self.token[:10]}...")
            return True, response
        
        return False, {}

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            print("❌ No token available for user info test")
            return False, {}
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        return success, response

    def test_create_profile(self):
        """Test profile creation"""
        if not self.token:
            print("❌ No token available for profile creation test")
            return False, {}
            
        profile_data = {
            "name": f"Test Profile {int(time.time())}",
            "avatar": "https://i.pravatar.cc/150?img=1",
            "is_kid": False,
            "language": "en"
        }
        
        success, response = self.run_test(
            "Create Profile",
            "POST",
            "profiles",
            200,
            data=profile_data
        )
        
        if success and 'id' in response:
            self.profile_id = response['id']
            print(f"Created profile with ID: {self.profile_id}")
            
        return success, response

    def test_get_profiles(self):
        """Test getting all profiles"""
        if not self.token:
            print("❌ No token available for get profiles test")
            return False, {}
            
        return self.run_test(
            "Get Profiles",
            "GET",
            "profiles",
            200
        )

    def test_get_popular_movies(self):
        """Test getting popular movies"""
        if not self.token:
            print("❌ No token available for popular movies test")
            return False, {}
            
        return self.run_test(
            "Get Popular Movies",
            "GET",
            "movies/popular",
            200
        )

    def test_get_popular_tv_shows(self):
        """Test getting popular TV shows"""
        if not self.token:
            print("❌ No token available for popular TV shows test")
            return False, {}
            
        return self.run_test(
            "Get Popular TV Shows",
            "GET",
            "tv/popular",
            200
        )

    def test_get_trending_content(self):
        """Test getting trending content"""
        if not self.token:
            print("❌ No token available for trending content test")
            return False, {}
            
        return self.run_test(
            "Get Trending Content",
            "GET",
            "content/trending",
            200
        )

    def test_search_content(self):
        """Test content search"""
        if not self.token:
            print("❌ No token available for content search test")
            return False, {}
            
        return self.run_test(
            "Search Content",
            "GET",
            "content/search?q=star",
            200
        )

    def test_add_to_watchlist(self):
        """Test adding to watchlist"""
        if not self.token or not self.profile_id:
            print("❌ No token or profile ID available for watchlist test")
            return False, {}
            
        # First get a movie to add to watchlist
        success, movies = self.run_test(
            "Get Movie for Watchlist",
            "GET",
            "movies/popular",
            200
        )
        
        if not success or not movies:
            return False, {}
            
        movie = movies[0]
        
        watchlist_data = {
            "content_id": movie["id"],
            "content_type": movie["content_type"]
        }
        
        return self.run_test(
            "Add to Watchlist",
            "POST",
            f"watchlist/{self.profile_id}",
            200,
            data=watchlist_data
        )

    def test_get_watchlist(self):
        """Test getting watchlist"""
        if not self.token or not self.profile_id:
            print("❌ No token or profile ID available for get watchlist test")
            return False, {}
            
        return self.run_test(
            "Get Watchlist",
            "GET",
            f"watchlist/{self.profile_id}",
            200
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Netflix API Tests")
        
        # Basic health check
        self.test_health()
        
        # Authentication tests
        register_success, _ = self.test_register()
        if not register_success:
            print("❌ Registration failed, stopping tests")
            return
            
        login_success, _ = self.test_login()
        if not login_success:
            print("❌ Login failed, stopping tests")
            return
            
        self.test_get_current_user()
        
        # Profile tests
        profile_success, _ = self.test_create_profile()
        if not profile_success:
            print("❌ Profile creation failed, stopping tests")
            return
            
        self.test_get_profiles()
        
        # Content tests
        self.test_get_popular_movies()
        self.test_get_popular_tv_shows()
        self.test_get_trending_content()
        self.test_search_content()
        
        # Watchlist tests
        self.test_add_to_watchlist()
        self.test_get_watchlist()
        
        # Print results
        print(f"\n📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")

def main():
    # Get backend URL from frontend .env
    backend_url = "https://02eff32c-9b4c-454d-bff4-ec6d8dafc341.preview.emergentagent.com"
    
    # Run tests
    tester = NetflixAPITester(backend_url)
    tester.run_all_tests()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())