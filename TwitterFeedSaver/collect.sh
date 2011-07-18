#!/bin/bash

# This runs the twitter collector constantly
# When the script recieves an EOF (which twitter randomly sends) it ends
#  this keeps it from just stopping so you can continually run it.

while true; do
php -f ./index.php	#Collect
sleep 2				#Lets give it a 2 second break 
done