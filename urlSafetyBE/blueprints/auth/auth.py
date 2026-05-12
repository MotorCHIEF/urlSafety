from flask import make_response, jsonify, request, Blueprint
import jwt
import datetime
import bcrypt
from bson import ObjectId
from decorators import jwtrequired, adminRequired, checkIDLength
import globals
from flask_mail import Message
#imports

authBP = Blueprint('authBP', __name__) #name of blueprint

users = globals.db.users
blackList = globals.db.blacklist
#variables for users and blacklist collections

mail = globals.mail

@authBP.route('/api/v1.0/login', methods=['GET']) #login endpoint
def login():
    auth = request.authorization
    if auth:
        user = users.find_one({'username' : auth.username}) # checks if username provided is listed in users collection
        if user is not None:
            if bcrypt.checkpw(bytes(auth.password, 'UTF-8'), user['password']): #converts provided password to hash value to check if it matches with the password associated with user
                #jwt login token created and encrypted
                token = jwt.encode({'user' : auth.username, 'admin' : user['admin'], '_id' : str(user['_id']), 'exp' : datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=30)}, globals.secretKey, algorithm='HS256')
                return make_response(jsonify({'token' : token}), 200)
            else:
                return make_response(jsonify({'message' : 'Incorrect Password'}), 401)
        else:
            return make_response(jsonify({'message' : 'Incorrect Username'}), 401)
    return make_response('Could not verify', 401, {'WWW-Authenticate' : 'Basic realm = "Login Required"'})

@authBP.route('/api/v1.0/logout', methods=['GET']) #logout endpoint
@jwtrequired
def logout():
    token = request.headers['x-access-token']
    blackList.insert_one({'token' : token}) #adds jwt token to blacklist collection
    return make_response(jsonify({'message' : 'logout successful'}), 200)

@authBP.route('/api/v1.0/users', methods=['POST']) #add new user collection
def addUser():
    if 'name' in request.form and 'username' in request.form and 'password' in request.form and 'email' in request.form:
        exists = users.find_one({'$or' : [{'username' : request.form['username']}, {'email' : request.form['email']}]})
        if exists is not None:
            return make_response(jsonify({'error' : 'username ir email already exists'}), 409)
        password = request.form['password'].encode('utf-8')
        user = { #new user
            'name' : request.form['name'],
            'username' : request.form['username'],
            'password' : password,
            'email' : request.form['email'],
            'admin' : False }
        user['password'] = bcrypt.hashpw(password, bcrypt.gensalt()) #convert password string to hash value
        result = users.insert_one(user) #insert new user to user collection
        newUserLink = 'http://localhost:5000/api/v1.0/users/' + str(result.inserted_id)
        return make_response(jsonify({'created' : newUserLink}), 201)
    else:
        return make_response(jsonify({'error' : 'missing form data'}), 404)


@authBP.route('/api/v1.0/users/<id>', methods=['DELETE']) #delete user endpoint 
@jwtrequired
@adminRequired
@checkIDLength
def deleteUser(id):
    checkUser = users.find_one({'_id' : ObjectId(id)}) #check if provided user id exists in the user collection
    if checkUser is None:
        return make_response(jsonify({'error' : 'invalid user id'}), 404)
    else:
        result = users.delete_one({'_id' : ObjectId(id)}) #deletes user from users collection
    if result.deleted_count == 1:
        return make_response(jsonify({}), 204)
    
@authBP.route('/api/v1.0/forgotpassword', methods=['POST']) #forgot password endpoint
def forgotPassword():
    if 'email' not in request.form: #check if an email has been provided
        return make_response(jsonify({'error' : 'missing email'}), 400)
    user = users.find_one({'email' : request.form['email']}) #check if users exists with provided email
    if user:
        resetToken = jwt.encode({'_id': str(user['_id']), 'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=15)}, globals.secretKey, algorithm='HS256')
        resetLink = 'http://localhost:4200/resetpassword/' + str(resetToken) #create reset token, that has 15 minute lifespan + create reset link
        try:
            msg = Message(subject='URL Safety Check - Password Reset Request', recipients=[request.form['email']]) #create email message to be sent
            msg.body = 'Hello ' + user['name'] + '\n\nYou recently requested to reset your password for your URL Safety Check account \nClick the link below to reset it. This link will expire in 15 minutes.\n'+ resetLink + '\nIf you did not request a password reset, please ignore this email.\n\nRegards,\nThe URL Safety Check Team'
            mail.send(msg) #sned message
            return make_response(jsonify({'url' : resetLink}), 200) #return new reset link
        except Exception as e:
            print(e)
            return make_response(jsonify({'error' : 'error connecting to mail server'}), 500)
    return make_response(jsonify({'message' : 'if an account exists, a reset link has been be sent'}), 200)


@authBP.route('/api/v1.0/resetpassword/<token>', methods=['PUT']) #reset password endpoint
def resetPassword(token):
    if 'password' not in request.form: #check if password has been provided
        make_response(jsonify({'error' : 'missing password'}), 400)
    try:
        data = jwt.decode(token, globals.secretKey, algorithms=['HS256']) 
        userID = data.get('_id') #get user _id
        newPassword = request.form['password'].encode('utf-8') #encode new password
        hashPassword = bcrypt.hashpw(newPassword, bcrypt.gensalt()) #turn password into hash value
        result = users.update_one({'_id' : ObjectId(userID)}, {'$set' : {'password' : hashPassword}}) #update password in db
        if result.modified_count == 1:
            return make_response(jsonify({'message': 'Password updated successfully'}), 201) #return susccess message
        else:
            return make_response(jsonify({'error': 'Unable to update password'}), 400)
    except Exception as e:
        make_response(jsonify({'error' : 'link invalid or expired'}), 401) #error message for invalid or expired token