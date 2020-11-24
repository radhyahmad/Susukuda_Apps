use gateway_core::gateway::publisher::Channel;
use local::device_auth::keystore::KeyManager;
use local::mqtt_connectivity::mqtt_client;
use local::types::config::Config;

use std::collections::HashMap;
use std::fs::File;
use std::sync::{ Arc, Mutex };

type Error = Box<dyn std::error::Error>;
type Result<T, E = Error> = std::result::Result<T, E>;

async fn post_channel(channel: String) -> Result<()> {
    let mut map = HashMap::new();
    map.insert("channel", channel);

    for (key, value) in &map {
        println!("{}: {}", key, value);
    }

    let client = reqwest::Client::new();
    // let req = client.post("http://localhost:10001/v1/channel").json(&map);
    let req = client.post("https://monitoring.arkandina.tech/v1/channel").json(&map);

    let res = req.send().await?;
    println!("{}", res.status());

    let body = res.bytes().await?;
    let v = body.to_vec();
    let s = String::from_utf8_lossy(&v);

    println!("response: {} ", s);
    Ok(())
}

#[tokio::main]
async fn main() -> () {
    // read configuration file
    let config: Config = serde_json::from_reader(File::open("config.json").unwrap()).unwrap();

    let store = KeyManager::new(config.whitelisted_device_ids);

    println!("Starting....");

    let channel = Arc::new(Mutex::new(Channel::new(
        config.node,
        config.mwm,
        config.local_pow,
        None,
    )));
    let (addr, msg) = match channel.lock().expect("").open() {
        Ok(a) => a,
        Err(_) => panic!("Could not connect to IOTA Node, try with another node!"),
    };
    let mut owned_string: String = addr.to_owned();
    let borrowed_string1: &str = ":";
    let borrowed_string2: String = msg;
    owned_string.push_str(borrowed_string1);
    owned_string.push_str(&borrowed_string2);
    post_channel(owned_string).await.map_err(|err| println!("{:?}", err)).ok();
    // println!("Channel root: {:?}", format!("{}:{}", addr, msg));
    println!(
        "\n To read the messages copy the channel root into https://explorer.iot2tangle.io/ \n "
    );

    let store = Arc::new(Mutex::new(store));
    mqtt_client::start(
        config.username,
        config.password,
        config.broker_ip,
        config.broker_port,
        config.topic,
        channel,
        store,
    )
    .await;
}
