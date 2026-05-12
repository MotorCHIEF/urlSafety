from services.googleService import SafeBrowsingService
import ssl
import socket
from urllib.parse import urlparse
from datetime import datetime
import tldextract
import whois
from dateutil import parser
import re
import ipaddress
#Imports 


weights = { #Weights for each check in overall safety score calculation
    'googleCheck' : 0.4,
    'sslCert' : 0.15,
    'sslExpire' : 0.1,
    'domainAge' : 0.15,
    'urlAnalysis' : 0.2
}

suspicousKeywords = re.compile( #regular expression for words commonly used in social engineering
    r'(login|signin|secure|verify|account|auth|update|required|urgent|'
    r'invoice|payment|bill|transfer|reciept|free|gift|prize|unlimited|'
    r'file|downloaded|doc|pdf)', re.IGNORECASE)

cloudDomains = re.compile(r'(storage.googleapis.com|firebasestorage.googleapis.com|amazonaws.com|'
                          r'blob.core.windows.net|dropbox.com|docs.google.com|drive.google.com)', re.IGNORECASE)


def isValidURL(url):
    if not url.startswith(('http://', 'https://')): #if submitted url does not include http/https, https is added to url
        url = 'http://' + url
    try:
        parsed = urlparse(url) #breaks url into main components and gets the hostname/server address
        hostname = parsed.hostname
        if not hostname:
            return False
        try:
            ipaddress.ip_address(hostname) #checks if the hostname is an ip address - if true returns else moves on
            return True
        except ValueError:
            pass
            
        extracted = tldextract.extract(hostname) #checks if hostname contains a suffix, e.g. .com, .co.uk, .org
        if not extracted.suffix:
            return False
        return True
    except Exception:
        return False
            

#Function to check URL against Google Safe Browsing API and obtain googleCheck score
def googleCheck(url):
    check = SafeBrowsingService() #Connection to googleService
    unsafe, threatype = check.checkURL(url) #checkURL() returns as True/False, data
    if unsafe: #if unsafe is true
        return {
            'score' : 0,
            'verdict' : 'UNSAFE',
            'reasons' : f'Flagged as {threatype}'
        }
    else: 
        return {
            'score' : 100,
            'verdict' : 'SAFE',
            'reasons' : 'No threats detected by Google Safe Browsing'
        }


#Function to check if URL has a SSL/TLS certificate and number of days until its expiration and obtain SSLCert & SSLExpire score
#Both checks perfomed in one function to imporove efficency
def sslCheck(url):
    result = {'sslCertValid' : {'score' : 0, 'verdict' : 'Invalid', 'details' : 'Connection Failed'},
            'sslExpire' : {'score' : 0, 'verdict' : 'Invalid', 'daysRemaining' : 0}
        }
    
    try:
        parsedURL = urlparse(url) #parses url in to 6 components with a general url structure, e.g. - ParseResult(scheme='http', netloc='docs.python.org:80', path='/3/library/urllib.parse.html', params='', query='highlight=params', fragment='url-parsing')
        host = parsedURL.netloc or parsedURL.path #if parseURL.netloc has no value, fallback and use parseURL.path

        if ':' in host:
            host = host.split(':')[0] #if port is in url strip it
        context = ssl.create_default_context()
        with socket.create_connection((host, 443), timeout=3.0) as sock: #open a tcp connection on port 443 (standard ssl port)
            with context.wrap_socket(sock, server_hostname=host) as ssock: #attemps to raise raw connection to a secure HTTPS connection, if cert invalid throws exception
                cert = ssock.getpeercert() #gets certificate details
                result['sslCertValid'] = {
                    'score' : 100,
                    'verdict' : 'Valid',
                    'details' : 'Certificate is Valid and Trusted'
                }

                sslExpire = cert['notAfter']
                expireDate = datetime.strptime(sslExpire, '%b %d %H:%M:%S %Y %Z')
                remaining = expireDate - datetime.utcnow()

                if remaining.days > 50:
                    result['sslExpire'] = {
                        'score' : 100,
                        'verdict' : 'Healthy',
                        'daysRemaining' : remaining.days
                    }
                elif remaining.days > 30:
                    result['sslExpire'] = {
                        'score' : 66,
                        'verdict' : 'Expiring Soon',
                        'daysRemaining' : remaining.days
                    }
                elif remaining.days > 0:
                    result['sslExpire'] = {
                        'score' : 33,
                        'verdict' : 'Expiring Very Soon',
                        'daysRemaining' : remaining.days
                    }
                else:
                    result['sslExpire'] = {
                        'score' : 0,
                        'verdict' : 'Expired',
                        'daysRemaining' : remaining.days
                    }

    except Exception as e:
        result['sslCertValid']['details'] = str(e)

    return result


#Function to check domain age and obtain domainAge score
def domainAgeCheck(url):
    try:
        extractedURL = tldextract.extract(url) #tldextract identifies the actual domain and not the subdomians
        who = whois.whois(extractedURL.top_domain_under_public_suffix) #queries the global WHOIS db for registration details on that domian
        creationDate = who.creation_date
        if creationDate is None:
            return {
                'days' : 'Unable to retrieve age of domain in days',
                'years': 'Unable to retrieve age of domain in years',
                'score' : 0,
                'created' : 'Unable to retrieve domains date of creation'
            }
        
        #WHOIS data is inconsistant as different registrars format data differently
        if isinstance(creationDate, list): #checks if registars returns a list of dates
            creationDate = creationDate[0]
        elif isinstance(creationDate, str): #checks if date is raw text
            try:
                creationDate = parser.parse(creationDate) #converts raw text date into datetime object
            except:
                return {
                'days' : 'Unable to retrieve age of domain in days',
                'years': 'Unable to retrieve age of domain in years',
                'score' : 0,
                'created' : 'Unable to retrieve domains date of creation'
                }
        
        if creationDate.tzinfo is not None: #strips timezone info to prevent python throwing an error due to trying to subtract a tz aware date
            creationDate = creationDate.replace(tzinfo=None)

        now = datetime.now()
        age = now - creationDate
        created = creationDate.strftime('%Y-%m-%d')

        if age.days < 30:
            score = 0
        
        elif age.days < 180:
            score = 45

        elif age.days < 360:
            score = 66

        else:
            score = 100

        return {
            'days': age.days,
            'years': round(age.days / 365, 1),
            'score': score,
            'created': created
        }
    except:
        return {
                'days' : 'Unable to retrieve age of domain in days',
                'years': 'Unable to retrieve age of domain in years',
                'score' : 0,
                'created' : 'Unable to retrieve domains date of creation'
            }


def urlAnalysis(url):
    try:
        parsedURL = urlparse(url)
        path = parsedURL.path
        domain = parsedURL.netloc

        foundKeywords = suspicousKeywords.findall(url) #checks if url contains above defined words
        foundKeywords = list(set(foundKeywords))

        foundDomians = cloudDomains.findall(url)
        foundDomians = list(set(foundDomians))

        dotCount = domain.count('.')
        slashCount = url.count('/')
        hypenCount = domain.count('-')

        score = 100
        reasons = []

        if foundKeywords:
            score -= 30
            reasons.append(f'Suspicious keywords found: {', '.join(foundKeywords)}')

        if foundDomians:
            score -= 50
            reasons.append(f'Suspicious domains found: {', '.join(foundDomians)}')

        if dotCount > 3:
            score -= 20
            reasons.append(f'High dot count in domain ({dotCount})')

        if slashCount > 5:
            score -= 20
            reasons.append(f'Deep URL path ({slashCount} slashes)')
        
        if hypenCount > 3:
            score -= 20
            reasons.append(f'High hypen count in domain ({hypenCount})')

        if re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\b', domain): #checks if domain looks like numbers - IP address
            score -= 50
            reasons.append('URL uses raw IP address instead of domain name')
        
        if score < 0:
            score = 0

        if score == 100:
            verdict = 'Safe Structure'
        elif score >= 50:
            verdict = 'Suspicious Structure'
        else:
            verdict = 'High Risk Structure'

        return {
            'score' : score,
            'verdict' : verdict,
            'details' : reasons if reasons else ['Clean URL structure'],
            'wordsFound' : foundKeywords
        }
    except Exception as e:
        return {'score': 0, 'verdict': 'Error', 'details': [f'Error analyzing URL structure: {e}']}


def analyseURL(url):
    googleresult = googleCheck(url) #call all different analysis methods
    sslresult = sslCheck(url)
    domainAgeresult = domainAgeCheck(url)
    urlAnalysisresult = urlAnalysis(url)

    #calculate over safety score
    overallScore = (googleresult['score'] * weights['googleCheck']) + \
                    (sslresult['sslCertValid']['score'] * weights['sslCert']) + \
                    (sslresult['sslExpire']['score'] * weights['sslExpire']) + \
                    (domainAgeresult['score'] * weights['domainAge']) + \
                    (urlAnalysisresult['score'] * weights['urlAnalysis'])
    
    #get overal safety verdict
    overallVerdict = 'SAFE' if overallScore >= 70 else 'SUSPICIOUS' if overallScore >=40 else 'UNSAFE'


    #convert analysis into a dictionary/json format for endpoints
    analysis = {
        "googleCheck" : googleresult['verdict'],
        "sslCertValid" : sslresult['sslCertValid']['verdict'],
        "sslExpire" : sslresult['sslExpire']['daysRemaining'],
        "domainAge" : domainAgeresult['days'],
        "urlAnalysis" : urlAnalysisresult['verdict'],
        'overallVerdict' : overallVerdict,
        'overallScore' : overallScore 
    }
    return analysis
