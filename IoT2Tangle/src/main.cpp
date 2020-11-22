/*
  IoT2Tangle Hackathon 2020,
  Contributor: Ahmad Radhy,
  Master Student in Physics Dept, Bandung Institute of Technology,
  ahmadradhyfisika@gmail.com,
  +6282134389939. 
*/

#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include "uFire_SHT20.h"
#include <OneWire.h>
#include <DallasTemperature.h>

struct dataSense
{
  float co2 = 0.0f;
  float air_temp = 0.0f;
  float air_hum = 0.0f;
  float air_press = 0.0f;
  float liq_temp = 0.0f;
};

uFire_SHT20 sht20;
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

static char payload[500];
static dataSense data;


const char* ssid = "LANTAI BAWAH 2";
const char* password = "ibudini17";

const char mqtt_server[] = "192.168.0.105";
const char publishTopic[] = "iot2tangle/sensor/susukuda"; 

WiFiClient espClient;
PubSubClient client(espClient);
long lastData = 0;

void setup_wifi(){

  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int i;
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(500);

    i++;
    if (i == 15)
    {
      Serial.print("\nWiFi Failed, restarting\n");
      delay(100);
      ESP.restart();
      i = 0;
    }
    
  }

  randomSeed(micros());
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect(){

  while (!client.connected())
  {
    Serial.print("Attempting MQTT connection ....");
    String clientID = "ESP32Client-";
    clientID += String(random(0xffff), HEX);

    if (client.connect(clientID.c_str()))
    {
      Serial.println("Connected to the cloud");
      digitalWrite(LED_BUILTIN, LOW);
    }

    else
    {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println("Try again in 5 second");
      digitalWrite(LED_BUILTIN, HIGH);
      delay(5000);
    }
    
  }
  
}

void sendData(){

  sht20.measure_all();
  sensors.requestTemperaturesByIndex(0);

  float air_temp = sht20.temperature();
  float air_hum = sht20.humidity();
  float air_press = sht20.vpd_kPa; 
  float co2 = 0.0F;
  float liq_temp = sensors.getTempCByIndex(0);


  int16_t co2_count = 0;

  while (co2_count < 100)
  {
    co2 += analogRead(36)/4096.0*3.30;
    co2_count++;
    delay(10);
  }

  data.air_temp = air_temp;
  data.air_hum = air_hum;
  data.air_press = air_press;
  data.co2 = co2 / 100;
  data.liq_temp = liq_temp;

const size_t capacity = JSON_ARRAY_SIZE(1) + JSON_ARRAY_SIZE(5) + 5*JSON_OBJECT_SIZE(1) + JSON_OBJECT_SIZE(2) + JSON_OBJECT_SIZE(3);
DynamicJsonDocument doc(capacity);
JsonArray iot2tangle = doc.createNestedArray("iot2tangle");
JsonObject iot2tangle_0 = iot2tangle.createNestedObject();
iot2tangle_0["sensor"] = "susukuda";
JsonArray iot2tangle_0_data = iot2tangle_0.createNestedArray("data");
JsonObject iot2tangle_0_data_0 = iot2tangle_0_data.createNestedObject();
iot2tangle_0_data_0["air_humidity"] = data.air_hum;
JsonObject iot2tangle_0_data_1 = iot2tangle_0_data.createNestedObject();
iot2tangle_0_data_1["air_pressure"] = data.air_press;
JsonObject iot2tangle_0_data_2 = iot2tangle_0_data.createNestedObject();
iot2tangle_0_data_2["co2_voltage"] = data.co2;
JsonObject iot2tangle_0_data_3 = iot2tangle_0_data.createNestedObject();
iot2tangle_0_data_3["liq_temperature"] = data.liq_temp;
JsonObject iot2tangle_0_data_4 = iot2tangle_0_data.createNestedObject();
iot2tangle_0_data_4["air_temperature"] = data.air_temp;
doc["device"] = "susukuda_device1";
doc["timestamp"] = "";
serializeJson(doc, payload); 

  long now = millis();
  if (now - lastData > 15000)
  {
    lastData = now;
    Serial.println(payload);
    client.publish(publishTopic, payload);
  }
  
}

void setup() {

  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
  Wire.begin();
  sht20.begin();
  sensors.begin();
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  
}

void loop() {

  if (!client.connected())
  {
    reconnect();
  }

  client.loop();
  sendData();

}