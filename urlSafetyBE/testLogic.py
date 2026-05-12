import unittest
from unittest.mock import patch, MagicMock
import logic
from datetime import datetime, timedelta

class testURLAnalysis(unittest.TestCase):

    def testInvalidURL(self):
        url = 'test-url'
        result = logic.isValidURL(url)
        self.assertFalse(result)

    def testValidURL(self):
        url = 'http://test-url.com'
        result = logic.isValidURL(url)
        self.assertTrue(result)

    def testValidURLIPAddress(self):
        url = "http://192.168.1.1/login"
        result = logic.isValidURL(url)
        self.assertTrue(result)

    def testUrlAnalysisSafe(self):
        url = 'https://www.google.com'
        result = logic.urlAnalysis(url)

        self.assertEqual(result['score'], 100)
        self.assertEqual(result['verdict'], 'Safe Structure')

    def testUrlAnalysisUnsafe(self):
        url = 'http://secure-login-update.com'
        result = logic.urlAnalysis(url)

        self.assertLess(result['score'], 100)
        self.assertIn("Suspicious keywords found", result['details'][0])
    
    def testUrlAnalysisIPAddress(self):
        url = "http://192.168.1.1/login"
        result = logic.urlAnalysis(url)
        
        self.assertEqual(result['verdict'], 'High Risk Structure')
        self.assertTrue(result['score'] <= 50)

    @patch('logic.socket.create_connection')
    @patch('logic.ssl.create_default_context')
    def testSSSLCheckValid(self, mockSslContext, mockSocket):
        mockSsock = MagicMock()
        mockSsock.getpeercert.return_value = {
            'notAfter': 'May 25 12:00:00 2030 GMT'
        }
        
        mockInstance = mockSslContext.return_value
        mockInstance.wrap_socket.return_value.__enter__.return_value = mockSsock
        
        result = logic.sslCheck("https://google.com")
        
        self.assertEqual(result['sslCertValid']['verdict'], 'Valid')
        self.assertEqual(result['sslExpire']['verdict'], 'Healthy')

    @patch('logic.SafeBrowsingService')
    def testGoogleCheckSafe(self, MockService):
        serviceInstance = MockService.return_value
        serviceInstance.checkURL.return_value = (False, None)

        result = logic.googleCheck('https://google.com')
        self.assertEqual(result['score'], 100)
        self.assertEqual(result['verdict'], 'SAFE')

    @patch('logic.SafeBrowsingService') 
    def testGoogleCheckUnsafe(self, mockService):
        serviceInstance = mockService.return_value
        serviceInstance.checkURL.return_value = (True, 'Malware')
        
        result = logic.googleCheck("http://testsafebrowsing.appspot.com/s/malware.html")
        
        self.assertEqual(result['score'], 0)
        self.assertEqual(result['verdict'], 'UNSAFE')

    @patch('logic.tldextract.extract')
    @patch('logic.whois.whois')
    def testDomainAgeUnsafe(self, mockWhoIs, mockExtract):
        mockExtract.return_value.top_domain_under_public_suffix = 'new-website.com'
        mockWhoIsResponse = MagicMock()
        mockWhoIsResponse.creation_date = datetime.now() - timedelta(days=10)
        mockWhoIs.return_value = mockWhoIsResponse
        
        result = logic.domainAgeCheck('http://new-website.com')

        self.assertEqual(result['score'], 0)
        self.assertLess(result['days'], 30)

    @patch('logic.tldextract.extract')
    @patch('logic.whois.whois')
    def testDomainAgeSafe(self, mockWhoIs, mockExtract):
        mockExtract.return_value.top_domain_under_public_suffix = 'google.com'
        mockWhoIsResponse = MagicMock()
        mockWhoIsResponse.creation_date = datetime.now() - timedelta(days=(365*5))
        mockWhoIs.return_value = mockWhoIsResponse
        
        result = logic.domainAgeCheck('http://google.com')

        self.assertEqual(result['score'], 100)
        self.assertEqual(result['days'], 1825)

    @patch('logic.tldextract.extract')
    @patch('logic.whois.whois')
    def testDomainMissingDate(self, mockWhoIs, mockExtract):
        mockExtract.return_value.top_domain_under_public_suffix = 'private-website.com'
        mockWhoIsResponse = MagicMock()
        mockWhoIsResponse.creation_date = None
        mockWhoIs.return_value = mockWhoIsResponse
        
        result = logic.domainAgeCheck('http://private-website.com')

        self.assertEqual(result['score'], 0)
        self.assertEqual(result['days'], 'Unable to retrieve age of domain in days')

    @patch('logic.tldextract.extract')
    @patch('logic.whois.whois')
    def testDomainAgeList(self, mockWhoIs, mockExtract):
        mockExtract.return_value.top_domain_under_public_suffix = 'list-website.com'
        mockWhoIsResponse = MagicMock()
        mockWhoIsResponse.creation_date = datetime.now() - timedelta(days=200)
        mockWhoIs.return_value = mockWhoIsResponse
        
        result = logic.domainAgeCheck('http://list-website.com')

        self.assertEqual(result['score'], 66)
        self.assertEqual(result['days'], 200)

    @patch('logic.urlAnalysis')
    @patch('logic.domainAgeCheck')
    @patch('logic.sslCheck')
    @patch('logic.googleCheck')
    @patch('logic.weights', { 
        'googleCheck': 0.4,
        'sslCert': 0.15,
        'sslExpire': 0.1,
        'domainAge': 0.15,
        'urlAnalysis': 0.2
    })
    def testAnalyseURLSafeVerdict(self, mockGoogle, mockSSL, mockDomain, mockURL):
        mockGoogle.return_value = {'score': 100, 'verdict' : 'SAFE'}
        mockSSL.return_value = {'sslCertValid': {'score': 100, 'verdict' : 'Valid'}, 'sslExpire': {'score': 100, 'daysRemaining' : 51}}
        mockDomain.return_value = {'score': 100, 'days' : 361}
        mockURL.return_value = {'score': 100, 'verdict' : 'Safe Structure'}

        result = logic.analyseURL('https://perfect-site.com')
        self.assertEqual(result['overallScore'], 100)
        self.assertEqual(result['overallVerdict'], 'SAFE')

    @patch('logic.urlAnalysis')
    @patch('logic.domainAgeCheck')
    @patch('logic.sslCheck')
    @patch('logic.googleCheck')
    @patch('logic.weights', { 
        'googleCheck': 0.4,
        'sslCert': 0.15,
        'sslExpire': 0.1,
        'domainAge': 0.15,
        'urlAnalysis': 0.2
    })
    def testAnalyseURLSuspiciousVerdict(self, mockGoogle, mockSSL, mockDomain, mockURL):
        mockGoogle.return_value = {'score': 50, 'verdict' : 'SAFE'}
        mockSSL.return_value = {'sslCertValid': {'score': 50, 'verdict' : 'Valid'}, 'sslExpire': {'score': 50, 'daysRemaining' : 30}}
        mockDomain.return_value = {'score': 50, 'days' : 180}
        mockURL.return_value = {'score': 50, 'verdict' : 'Safe Structure'}

        result = logic.analyseURL('http://mediocre-site.com')
        self.assertEqual(result['overallScore'], 50)
        self.assertEqual(result['overallVerdict'], 'SUSPICIOUS')

    @patch('logic.urlAnalysis')
    @patch('logic.domainAgeCheck')
    @patch('logic.sslCheck')
    @patch('logic.googleCheck')
    @patch('logic.weights', { 
        'googleCheck': 0.4,
        'sslCert': 0.15,
        'sslExpire': 0.1,
        'domainAge': 0.15,
        'urlAnalysis': 0.2
    })
    def testAnalyseURLUnSafeVerdict(self, mockGoogle, mockSSL, mockDomain, mockURL):
        mockGoogle.return_value = {'score': 0, 'verdict' : 'UNSAFE'}
        mockSSL.return_value = {'sslCertValid': {'score': 0, 'verdict' : 'Invalid'}, 'sslExpire': {'score': 0, 'daysRemaining' : 0}}
        mockDomain.return_value = {'score': 10, 'days' : 31}
        mockURL.return_value = {'score': 0, 'verdict' : 'High Risk Structure'}

        result = logic.analyseURL('http://evil-phishing-site.xyz')
        self.assertEqual(result['overallScore'], 1.5)
        self.assertEqual(result['overallVerdict'], 'UNSAFE')

if __name__ == '__main__':
    unittest.main()