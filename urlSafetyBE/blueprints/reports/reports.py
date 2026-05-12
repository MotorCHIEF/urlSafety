from flask import Blueprint, request, jsonify, make_response
from decorators import jwtrequired, adminRequired, checkIDLength
from bson import ObjectId
import globals
import logic
from datetime import datetime, timedelta
import jwt
#imports

reportsBP = Blueprint('reportsBP', __name__) #name of blueprint

reports = globals.db.reports
reportCache = globals.db.reportCache
#variables for reports and reportCache collections

@reportsBP.route('/api/v1/reports', methods=['GET']) #version 1 of get all reports from reports collection
@jwtrequired
def getAllReports():
    dataReturn = [] #list variable to hold reports
    for report in reports.find(): #get reports in reports collection and append them to dataReturn list
        report['_id'] = str(report['_id'])
        dataReturn.append(report)
    return make_response(jsonify(dataReturn), 200) #return dataReturn in a json format


@reportsBP.route('/api/v2/reports', methods=['GET']) #version 2 of get reorts from reort ollection - this version returns only reports associated with userID in jwt token
@jwtrequired
def getAllUserReports():
    dataReturn = [] #list variable to hold reports
    token = request.headers['x-access-token']
    data = jwt.decode(token, globals.secretKey, algorithms='HS256') #decode jwt token and extract userID
    userID = data.get('_id')

    pipeline = [{'$match' : {'userID' : userID}}, #aggregate pipeline that  finds reports that contains the userID variable value
                {'$project' : {'_id' : 1, 'url' : 1, 'userID' : 1, 'dateSubmitted' : 1, 'dateUpdated' : 1, 'analysis' : 1, 'safetyScore' : 1, 'previousScore' : 1, 'verdict' : 1}},
                {'$sort' : {'dateUpdated' : -1}}]
    for report in reports.aggregate(pipeline):
        report['_id'] = str(report['_id']) #add found reports to dataReturn list
        dataReturn.append(report)
    return make_response(jsonify(dataReturn), 200)

@reportsBP.route('/api/v3/reports', methods=['GET']) #version 2 of get reorts from reort ollection - this version returns same as version 2 but now includes pagintation
@jwtrequired
def getUserReports(): #pagintation
    pageNum = 1
    pageSize = 10
    if request.args.get('pn'):
        pageNum = int(request.args.get('pn'))
    if request.args.get('ps'):
        pageSize = int(request.args.get('ps'))
    pageStart = pageSize * (pageNum - 1)
    
    dataReturn = {'totalReports' : 0, #dataReturn - totalReports - tracks total number of reports returned for obtaining last page of pagintation for front-end
                  'reports' : []} #reports [] list to stor found reports
    
    token = request.headers['x-access-token']
    data = jwt.decode(token, globals.secretKey, algorithms='HS256') #decode jwt token and extract userID
    userID = data.get('_id')

    pipeline = [{'$match' : {'userID' : userID}}, #aggregate pipeline that  finds reports that contains the userID variable value
                {'$project' : {'_id' : 1, 'url' : 1, 'userID' : 1, 'dateSubmitted' : 1, 'dateUpdated' : 1, 'analysis' : 1, 'safetyScore' : 1, 'previousScore' : 1, 'verdict' : 1}},
                {'$sort' : {'dateUpdated' : -1}},
                {'$facet' : {'metadata' : [{'$count' : 'total'}], #facet appies pagination logic to pipeline
                             'data' : [{'$skip' : pageStart}, {'$limit' : pageSize}]}}]
    
    for report in reports.aggregate(pipeline):
        dataReturn['totalReports'] = report['metadata'][0]['total']
        for doc in report['data']: #add found reports to dataReturn list
            doc['_id'] = str(doc['_id'])
            dataReturn['reports'].append(doc)
    return make_response(jsonify(dataReturn), 200)

#Possible add check for admin to access individual reports
@reportsBP.route('/api/v1/reports/<id>', methods=['GET']) # endpoint to retrieve single report
@jwtrequired
@checkIDLength
def getSingleReport(id):
    token = request.headers['x-access-token']
    data = jwt.decode(token, globals.secretKey, algorithms='HS256') #decode jwt token and extract userID
    userID = data.get('_id')

    report = reports.find_one({'_id' : ObjectId(id), 'userID' : userID}) # retrieve reports that contains id passed in endpoint and userID of logged on user
    if report is None:
        return make_response(jsonify({'error' : 'invalid report ID or logged on user not associated with report.'}), 400)
    else:
        report['_id'] = str(report['_id'])
        return make_response(jsonify(report), 200)


@reportsBP.route('/api/v1/reports', methods=['POST']) #version 1 endpoint for create reports
@jwtrequired
def createReport():
    if 'url' in request.form:
        token = request.headers['x-access-token']
        data = jwt.decode(token, globals.secretKey, algorithms='HS256') #decode jwt token and extract userID
        userID = data.get('_id')
        analysis = logic.analyseURL(request.form['url']) # perform url Analysis 

        newReport = { #new report structure
            'url' : request.form['url'],
            'userID' : userID,
            'dateSubmitted' : datetime.utcnow(),
            'dateUpdated' : datetime.utcnow(),
            'analysis' : {
                'api' : analysis['googleCheck'], #result from google api check
                'sslCert' : analysis['sslCertValid'], #result from ssl ceertificate check
                'sslExpire' : analysis['sslExpire'], #result from ssl expiry check
                'domainAge' : analysis['domainAge'], #result from domain age check
                'urlAnalysis' : analysis['urlAnalysis'] #result from url structure analysis check
            },
            'safetyScore' : analysis['overallScore'], #overall safety score calculated by analysing the submitted url
            'previousScore' : None,
            'verdict' : analysis['overallVerdict'] #overall safety score calculated by analysing the submitted url
        }
        newReportID = reports.insert_one(newReport) #insert report into reports collection
        newReportLink = 'http://localhost:5000/api/v1/reports/' + str(newReportID.inserted_id) #new report link
        return make_response(jsonify({'url' :newReportLink}), 201)
    else:
        return make_response(jsonify({'error' : 'missing form data'}), 404)

@reportsBP.route('/api/v2/reports', methods=['POST']) #version 2 of insert reports endpoint - now incorporates upsert logic
@jwtrequired
def upsertReport():
    if 'url' in request.form:
        token = request.headers['x-access-token']
        data = jwt.decode(token, globals.secretKey, algorithms='HS256')
        userID = data.get('_id')
        report = reports.find_one({'url' : request.form['url'], 'userID' : userID}) # to stop user accidently accessing reports not associated with them
        if report is None: #if report does not ex perform anlsysis and creat new report
            analysis = logic.analyseURL(request.form['url'])
            newReport = {
                'url' : request.form['url'],
                'userID' : userID,
                'dateSubmitted' : datetime.utcnow(),
                'dateUpdated' : datetime.utcnow(),
                'analysis' : {
                    'api' : analysis['googleCheck'],
                    'sslCert' : analysis['sslCertValid'],
                    'sslExpire' : analysis['sslExpire'],
                    'domainAge' : analysis['domainAge'],
                    'urlAnalysis' : analysis['urlAnalysis']
                },
                'safetyScore' : analysis['overallScore'],
                'previousScore' : None,
                'verdict' : analysis['overallVerdict']
            }
            newReportID = reports.insert_one(newReport)
            newReportLink = 'http://localhost:5000/api/v2/reports/' + str(newReportID.inserted_id)
            return make_response(jsonify({'url' :newReportLink}), 201)
        else: #if report does exist check current time against dateUpdated
            currentDT = datetime.utcnow()
            timediff = currentDT - report['dateUpdated']
            if timediff.total_seconds() > (4 * 3600): #if dateUpdated is 4 hours older than the current time update report
                analysis = logic.analyseURL(request.form['url'])
                updateReport = reports.update_one({'_id' : ObjectId(report['_id']), 'userID' : userID}, 
                {'$set' : {'url' : request.form['url'],
                'userID' : userID,
                'dateSubmitted' : report['dateSubmitted'],
                'dateUpdated' : datetime.utcnow(),
                'analysis' : {
                    'api' : analysis['googleCheck'],
                    'sslCert' : analysis['sslCertValid'],
                    'sslExpire' : analysis['sslExpire'],
                    'domainAge' : analysis['domainAge'],
                    'urlAnalysis' : analysis['urlAnalysis']
                },
                'safetyScore' : analysis['overallScore'],
                'previousScore' : report['safetyScore'],
                'verdict' : analysis['overallVerdict']}})
                if updateReport.matched_count == 1:
                    updateReportLink = 'http://localhost:5000/api/v2/reports/' + str(report['_id'])
                    return make_response(jsonify({'url' : updateReportLink}), 201)
                else:
                    return make_response(jsonify({'error' : 'unable to update report'}), 400)
            else: #if dateUpdated is less than 4 hours older than current time retrieve report
                report['_id'] = str(report['_id'])
                return make_response(jsonify(report), 200)
    else:
        return make_response(jsonify({'error' : 'missing form data'}), 404)


@reportsBP.route('/api/v3/reports', methods=['POST']) #version 4 upsert reports - optimised version
@jwtrequired
def upsertReportWithCache():
    if 'url' not in request.form: #Check if url has been submitted
        return make_response(jsonify({'error' : 'missing form data'}), 404)
    
    url = request.form['url']
    if logic.isValidURL(url) is False:
        return make_response(jsonify({'error' : 'invlaid url entered. try again with a valid url' }), 400)

    token = request.headers['x-access-token']
    data = jwt.decode(token, globals.secretKey, algorithms='HS256')

    userID = data.get('_id') #get user id
    now = datetime.utcnow() #get current time

    userReport = reports.find_one({'url' : url, 'userID' : userID})

    if userReport: #check if user has previously submitted url
        age = (now - userReport['dateUpdated']).total_seconds()
        previousUserScore = userReport['safetyScore']
        if age < (4 * 3600): #check if previously submitted url was within 4 hours if so return report
            userReport['_id'] = str(userReport['_id'])
            return make_response(jsonify(userReport), 200) #works
    else:
        previousUserScore = 0
        
        
    cachedReport = reportCache.find_one({'url' : url}) #check if url is currently in cache collection
    analysisData = None #variable to hold report layout


    if cachedReport:
        cacheAge = (now - cachedReport['dateUpdated']).total_seconds()
        previousScore = cachedReport['safetyScore']

        if cacheAge < (4 * 3600): #check if previously submitted url was within last 4 hours
            analysisData = cachedReport
    else:
        previousScore = 0

    if not analysisData: #if url was submitted over 4 hurs age analyse url using logic.py
        analysis = logic.analyseURL(url)
        analysisData = { #structure of report
            'url' : url,
            'dateUpdated' : now,
            'analysis' : {
                'api' : analysis['googleCheck'],
                'sslCert' : analysis['sslCertValid'],
                'sslExpire' : analysis['sslExpire'],
                'domainAge' : analysis['domainAge'],
                'urlAnalysis' : analysis['urlAnalysis']
            },
            'safetyScore' : analysis['overallScore'],
            'previousScore' : previousScore,
            'verdict' : analysis['overallVerdict']
        }
        reportCache.update_one({'url' : url}, #upsert=true - if documents already exists in collection update it, else perform an insert
            {'$set' : analysisData, '$setOnInsert' : {'dateSubmitted' : now}}, upsert=True) #$SetOnInsert - if a document is inserted then $setOnInsert assigns the specified value to the document, if update operation $setOnInsert does nothing
    #both update works

    userReport = analysisData.copy() #create user version of report and add userID to report
    userReport['userID'] = userID
    userReport['dateUpdated'] = now
    userReport['previousScore'] = previousUserScore

    if '_id' in userReport:
        del userReport['_id'] #if _id field is present in user Report remove it

    if 'dateSubmitted' in userReport:
        del userReport['dateSubmitted'] #if _id field is present in user Report remove it

    result = reports.update_one({'url' : url, 'userID' : userID},
        {'$set' : userReport, '$setOnInsert' : {'dateSubmitted' : now}}, upsert=True)  #upsert=true - if documents already exists in collection update it, else perform an insert
    #$SetOnInsert - if a document is inserted then $setOnInsert assigns the specified value to the document, if update operation $setOnInsert does nothing

    reportID = result.upserted_id
    if not reportID:
        reportID = reports.find_one({'url' : url, 'userID' : userID}, {'_id' : 1})['_id']
    
    reportLink = 'http://localhost:5000/api/v1/reports/' + str(reportID)
    return make_response(jsonify({'url' : reportLink}), 201)

@reportsBP.route('/api/v1/reports/<id>', methods=['DELETE']) #version 1 delte report 
@jwtrequired
@adminRequired
def deleteReport(id):
    delete = reports.delete_one({'_id' : ObjectId(id)}) #delte report associated with id provided in endpoint
    if delete.deleted_count == 1:
        return make_response(jsonify({}), 204)
    else:
        return make_response(jsonify({'error' : 'invalid id'}), 404)
    
@reportsBP.route('/api/v2/reports', methods=['DELETE']) #version 2 delete report - now report id and userID must be provided to delte reports
@jwtrequired
@adminRequired
def deleteUserReport():
    if 'url' not in request.form or 'userID' not in request.form:
        return make_response(jsonify({'error' : 'missing form data'}), 400)
    
    delete = reports.delete_one({'url' : request.form['url'], 'userID' : request.form['userID']})#delete report associated with provided id and userID
    if delete.deleted_count == 1:
        return make_response(jsonify({}), 204)
    else:
        return make_response(jsonify({'error' : 'unable to delete report'}), 404)