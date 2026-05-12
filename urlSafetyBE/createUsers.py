import bcrypt
import globals#imports


users = globals.db.users#get user collection

userList = [#user dummy data for 
                {
                    "name" : "Admin",
                    "username" : "admin",
                    "password" : b"password",
                    "email" : "admin@admin.net",
                    "admin" : True
                },

                {
                    "name" : "Quentin McGuigan",
                    "username" : "qmcguigan",
                    "password" : b"bricksep",
                    "email" : "qmcguigan@app.net",
                    "admin" : False
                },

                {
                    "name" : "John Doe",
                    "username" : "jdoe",
                    "password" : b"escortmk2",
                    "email" : "jdoe@app.net",
                    "admin" : False
                },
                  
                {
                    "name" : "Jane Doe",
                    "username" : "janedoe",
                    "password" : b"doeadeer",
                    "email" : "jdoe2@app.net",
                    "admin" : False
                },

                {
                    "name" : "Jason Todd",
                    "username" : "jtodd",
                    "password" : b"redhood",
                    "email" : "jtodd@app.net",
                    "admin" : False
                }
            ]

for newUser in userList: #loop to convert password string to hash value then insert to db
    newUser["password"] = bcrypt.hashpw(newUser["password"], bcrypt.gensalt())
    users.insert_one(newUser)#add user to user collection