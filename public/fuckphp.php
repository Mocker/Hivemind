<?php

$phone = 1234567890 ;
#$phone = "$phone";
print "PHONE: $phone\n";

$sphone = sprintf('%03d-%03d-%04d',$phone,$phone,$phone);
#list(

print "PHONE: $sphone - ".substr($phone,0,3)." ".substr($phone,3,3)."-".substr($phone,6)."\n";



?>
