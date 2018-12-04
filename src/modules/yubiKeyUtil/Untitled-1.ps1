
#$entryStation = read-host "What station are you starting at?"
#$destStation = read-host "What station is your destination?"
$entryStation = "BALB"
$destStation = "DBRK"

# Get recommended Sched
$payload = Invoke-RestMethod -uri "http://api.bart.gov/api/sched.aspx?cmd=depart&orig=$entryStation&dest=$destStation&date=now&key=MW9S-E7SL-26DU-VV8V&l=1&json=y" -Method Get

# Collect the Recommended Trips
$rec_trips = $payload.root.schedule.request.trip

# Skip the transfers for now
foreach( $trip in $rec_trips ){
    if($trip.leg.length -eq 1){
        $rec_trip = $trip
    }

}

# Get the details of the Rec Route
$route_details = Invoke-RestMethod -uri "http://api.bart.gov/api/route.aspx?cmd=routeinfo&route=$($rec_trip.leg.'@line'.split(' ')[1])&key=MW9S-E7SL-26DU-VV8V&json=y" -Method Get

# Route Direction
$routeDirection = $route_details.root.routes.route.direction.Substring(0,1)
# Stations in Route
$routeStations = $route_details.root.routes.route.config.station
# Train Dest Name
$trainDest = $route_details.root.routes.route.destination

$prevStationIndex = $routeStations[$routeStations.IndexOf($entryStation) - 1]

$curStation = (Invoke-RestMethod -uri "http://api.bart.gov/api/etd.aspx?cmd=etd&orig=$entryStation&json=y&key=MW9S-E7SL-26DU-VV8V" -Method Get).root.station.etd
$prevStation = (Invoke-RestMethod -uri "http://api.bart.gov/api/etd.aspx?cmd=etd&orig=$prevStationIndex&json=y&key=MW9S-E7SL-26DU-VV8V" -Method Get).root.station.etd #&dir=$routeDirection" -Method Get

# Get the Train Line times
$recLineCurStation = $curStation | where-object {$_.abbreviation -eq $trainDest} | Select-Object destination, abbreviation, @{name="min";expression={ $_.estimate[0].minutes}}
$recLinePrevStation = $prevStation | Where-Object {$_.abbreviation -eq $trainDest} | Select-Object destination, abbreviation, @{name="min";expression={ $_.estimate[0].minutes}}

if($routeDirection -eq "North"){
    $oppRouteDir = "South"
}
else{
    $oppRouteDir = "North"
}
# Get Opposite Line Times
#$oppLinesCurStation = 
$opLineCurState = $curStation | Where-Object {$_.estimate.direction -eq $oppRouteDir} | Select-object destination, abbreviation, @{name="min";expression={ $_.estimate[0].minutes}}
#write-host "Current Station`n" -Object $var

#$oppLinesPrevStation = 
$opLinePrevState = $prevStation | Where-Object {$_.estimate.direction -eq $oppRouteDir} | Select-Object destination, abbreviation, @{name="min";expression={ $_.estimate[0].minutes}}
#write-host "Previous Station`n" -Object $var2


write-host "$entryStation in  [$($recLineCurStation.min)]min"
Write-Host "$prevStationIndex in [$($recLinePrevStation.min)]min"


$average = 0
$divisor = 0

for( $x=0; $x -lt $opLineCurState.length; $x++ ){
    
    if( $opLineCurState[$x].min -eq "Leaving"){
        $opLineCurState[$x].min = 0
    }
    elseif ( $opLinePrevState[$x].min -eq "Leaving" ){
        $opLinePrevState[$x].min = 0
    }
    
    if ([int]$opLineCurState[$x].min -gt [int]$oplinePrevState[$x].min ) {
        [int]$value1 = $opLineCurState[$x].min
        [int]$value2 = $opLinePrevState[$x].min
        write-host "val1: $value1  val2: $value2" -ForegroundColor Green
        [int]$total = $value1 - $value2
    
        $average = $average + $total
    
        $divisor ++
    }
    elseif ([int]$opLineCurState[$x].min -lt [int]$oplinePrevState[$x].min ){
        [int]$value1 = $opLineCurState[$x].min
        [int]$value2 = $opLinePrevState[$x].min

        write-host "val1: $value1  val2: $value2 total[$([int]$value1 - [int]$value2)]" -ForegroundColor Yellow
    }

    

}

$average = $average / [math]::Round($divisor)


Write-Host "Average Travel Time: $average"



## [time]$arriveAt = $tripobject.'@origTime'
## [bool]$transfer = $tripobject.trips.length > 1

#$curStation | where-object {$_.estimate.direction -eq "South"} | %{ @{destination=$_.destination;abbreviation=$_.abbreviation;estimate=$_.estimate[0].minutes }}

## Get the dest station Information
## http://api.bart.gov/api/stn.aspx?cmd=stninfo&key=MW9S-E7SL-26DU-VV8V&json=y&orig=DBRK

# station routes
## payload.root.stations.station.north_routes.route == []
## payload.root.stations.station.south_routes.route == []

# create route list

## Get route information
## http://api.bart.gov/api/route.aspx?cmd=routeinfo&route= $($routeID) &key=MW9S-E7SL-26DU-VV8V&json=y

# check for both stations in route

# create usable route list