<?php
/**
 * CAMS Air Quality Data Fetcher for Ioannina City, Greece
 * Requires PHP 7.4+ with cURL extension
 */

class IoanninaAirQuality {
    private $apiUrl = 'https://api.atmosphere.copernicus.eu/api/v2';
    private $apiKey = '638821d7-af42-4795-9595-b313c7a0526e'; // Replace with your actual API key
    private $ioanninaCoords = [
        'latitude' => 39.6650,
        'longitude' => 20.8537
    ];
    
    // Method to make authenticated requests
    private function makeRequest($endpoint, $params = []) {
        $url = $this->apiUrl . $endpoint;
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            echo 'CURL error: ' . curl_error($ch).PHP_EOL;
            throw new Exception('CURL error: ' . curl_error($ch));
        }
        
        curl_close($ch);
        
        if ($httpCode >= 400) {
             echo "API request failed with HTTP code $httpCode".PHP_EOL;
            throw new Exception("API request failed with HTTP code $httpCode");
        }
        
        return json_decode($response, true);
    }
    
    // Get air quality data for Ioannina
    public function getIoanninaAirQuality($parameters = ['pm10', 'pm2_5', 'no2', 'o3'], $startDate = null, $endDate = null) {
        // Default to last 24 hours if no dates provided
        if ($startDate === null) {
            $startDate = (new DateTime('-1 day'))->format('Y-m-d\TH:i:s\Z');
        }
        if ($endDate === null) {
            $endDate = (new DateTime())->format('Y-m-d\TH:i:s\Z');
        }
        
        try {
            $params = [
                'lat' => $this->ioanninaCoords['latitude'],
                'lon' => $this->ioanninaCoords['longitude'],
                'variable' => implode(',', $parameters),
                'time_start' => $startDate,
                'time_end' => $endDate,
                'format' => 'json'
            ];
            
            return $this->makeRequest('/data', $params);
        } catch (Exception $e) {
            error_log("Error fetching air quality data for Ioannina: " . $e->getMessage());
            return null;
        }
    }
    
    // Format the data for display with Ioannina-specific info
    public function formatIoanninaAirQuality($data) {
        if (empty($data) || !isset($data['data'])) {
            return "<p>No air quality data available for Ioannina.</p>";
        }
        
        $formatted = "<h2>Ioannina Air Quality Data</h2>";
        $formatted .= "<p>Location: 39.6650° N, 20.8537° E</p>";
        $formatted .= "<table border='1'><tr><th>Parameter</th><th>Value</th><th>Unit</th><th>Time</th></tr>";
        
        foreach ($data['data'] as $measurement) {
            $formatted .= sprintf(
                "<tr><td>%s</td><td>%.2f</td><td>%s</td><td>%s</td></tr>",
                htmlspecialchars($measurement['variable']),
                $measurement['value'],
                htmlspecialchars($measurement['unit']),
                htmlspecialchars($measurement['time'])
            );
        }
        
        $formatted .= "</table>";
        
        // Add air quality interpretation
        $formatted .= $this->getAirQualityInterpretation($data['data']);
        
        return $formatted;
    }
    
    // Add basic air quality interpretation
    private function getAirQualityInterpretation($measurements) {
        $interpretation = "<h3>Air Quality Interpretation</h3><ul>";
        
        foreach ($measurements as $m) {
            $param = $m['variable'];
            $value = $m['value'];
            $unit = $m['unit'];
            
            $interpretation .= "<li><strong>$param</strong> ($unit): ";
            
            switch ($param) {
                case 'pm2_5':
                    if ($value <= 10) $interpretation .= "Good";
                    elseif ($value <= 25) $interpretation .= "Moderate";
                    else $interpretation .= "Poor";
                    break;
                    
                case 'pm10':
                    if ($value <= 20) $interpretation .= "Good";
                    elseif ($value <= 50) $interpretation .= "Moderate";
                    else $interpretation .= "Poor";
                    break;
                    
                case 'no2':
                    if ($value <= 40) $interpretation .= "Good";
                    elseif ($value <= 100) $interpretation .= "Moderate";
                    else $interpretation .= "Poor";
                    break;
                    
                case 'o3':
                    if ($value <= 60) $interpretation .= "Good";
                    elseif ($value <= 120) $interpretation .= "Moderate";
                    else $interpretation .= "Poor";
                    break;
                    
                default:
                    $interpretation .= "Value recorded";
            }
            
            $interpretation .= "</li>";
        }
        
        $interpretation .= "</ul>";
        return $interpretation;
    }
}

// Example usage for Ioannina
$ioanninaAir = new IoanninaAirQuality();

// Get air quality data for Ioannina
$airQualityData = $ioanninaAir->getIoanninaAirQuality();

// Display results
echo "<!DOCTYPE html>
<html>
<head>
    <title>Ioannina Air Quality</title>
    <style>
        table { border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px 12px; border: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Ioannina City Air Quality Report</h1>";

if ($airQualityData) {
    echo $ioanninaAir->formatIoanninaAirQuality($airQualityData);
} else {
    echo "<p>Failed to retrieve air quality data for Ioannina. Please try again later.</p>";
}

echo "</body></html>";
?>