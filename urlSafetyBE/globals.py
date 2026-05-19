from pymongo import MongoClient
from flask_mail import Mail
import os
#imports

secretKey = '###########'

#client = MongoClient('mongodb://127.0.0.1:27017')
cloud = os.environ.get('cloudDBKey')
client = MongoClient(cloud)
db = client.urlSafetyDB

mail = Mail() #initialise mail variable to send rest email
