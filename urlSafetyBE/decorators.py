from flask import request, jsonify, make_response
import jwt
from functools import wraps
import globals
#imports

users = globals.db.users
blackList = globals.db.blacklist
#variables for users and blcaklist collections

def jwtrequired(func): #decorator to check if a valid jwt token is present
    @wraps(func)
    def jwtRequiredWrap(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers: #check enpoint header if an x-access-token value is present
            token = request.headers['x-access-token']
        if not token:
            return make_response(jsonify({'message' : 'token is missing'}), 401) #if not token is present
        try:
            data = jwt.decode(token, globals.secretKey, algorithms='HS256')
        except:
            return make_response(jsonify({'message' : 'token is invalid'}), 401) #if token is expired
        blToken = blackList.find_one({'token' : token})
        if blToken is not None:
            return make_response(jsonify({'message' : 'token has been cancelled'}), 401) #if token is listed in blacklist collection
        return func(*args, **kwargs)
    return jwtRequiredWrap

def adminRequired(func): #decorator to check if logged on user has admin role priveledges
    @wraps(func)
    def adminRequiredWrap(*args, **kwargs):
        token = request.headers['x-access-token']
        data = jwt.decode(token, globals.secretKey, algorithms='HS256') #decode jwt token to plaintext
        if data['admin']: # check if admin = true
            return func(*args, **kwargs)
        else:
            return make_response(jsonify({'message' : 'admin access required'}), 401)
    return adminRequiredWrap

def checkIDLength(func):#decorator to check id length
    @wraps(func)
    def checkIDLenghtWraps(*args, **kwargs):
            idValue = kwargs.get('id')
            if len(idValue) != 24:#check for if id length is 24 chatacters long
                return make_response(jsonify({'error' : 'Invalid ID length'}), 404)#Error message for invalid id length
            return func(*args, **kwargs)
    return checkIDLenghtWraps