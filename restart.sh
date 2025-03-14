docker build -t webhook-listener .
docker rm -f webhook-listener
docker run -d --name webhook-listener -p 9999:9999 webhook-listener
