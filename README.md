A micro web app for easier interfacing with Clinvar<a href="http://192.241.244.189:7070" target="_blank">here</a>.
## Running the server

### Prerequisites
* Install required Python packages with following command:
```
$ pip install -r requirements.txt
```

### Run the server
* To run the server locally, use command below:
```
$ python main.py
```
* WSGI app of the application is `app` in `main.py`; e.g. to deploy use gunicorn, use following command
```
$ gunicorn -w 3 main:app
```