# Queries used to set up inital BlogDB

CREATE TABLE users (<br>
    user_id VARCHAR(255) PRIMARY KEY,<br>
    password VARCHAR(255),<br>
	name VARCHAR(255)<br>
);<br>


CREATE TABLE blogs (<br>
    blog_id SERIAL PRIMARY KEY,<br>
    creator_name VARCHAR(255),
    creator_user_id VARCHAR(255) REFERENCES users(user_id),<br>
    title VARCHAR(255),<br>
    body TEXT,<br>
    date_created TIMESTAMP, <br>
	time_updated TIMESTAMP,<br>
	tag VARCHAR(255)<br>
);<br>



INSERT INTO users (user_id, password, name)<br>
VALUES ('gandalf123', '123456abc!', 'gandalf');<br>

INSERT INTO users (user_id, password, name)<br>
VALUES ('frodo_bag', 'xyz9876$', 'frodo');<br>

INSERT INTO users (user_id, password, name)<br>
VALUES ('samwise_gamgee', 'lmn456&', 'samwise');<br>


INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created, time_updated, tag )<br>
VALUES ('gandalf', 'gandalf123', 'Bilbos Birthday', 'I shouldve known he wouldnt just have a normal party. Guess its questin time...', '2025-10-05 10:30:00' , '2025-10-06 8:15:00', 'diy');<br>

INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created, tag )<br>
VALUES ('gandalf', 'gandalf123', 'No Passing', 'Fell with a Balrog, wouldn not reccomend', '2025-10-04 09:10:00' , 'lifestyle');<br>

INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created, tag )<br>
VALUES ('frodo', 'frodo_bag', 'New Jewlrey!', 'Got a new ring from Bilbo, hope its not all powerful or anything', '2025-10-04 06:45:00' , 'tech');<br>

INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created, time_updated,  tag )<br>
VALUES ('samwise', 'samwise_gamgee', 'The baggins need help', 'literally they cant be normal for two seconds. Why is it always a baggins???', '2025-10-05 11:15:00' , '2025-10-06 4:27:00' , '');<br>

INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created, tag )<br>
VALUES ('samwise', 'samwise_gamgee', 'adventure??', 'this is so not my job. :/', '2025-10-07 12:59:00', 'gardening');
