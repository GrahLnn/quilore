// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // tracing_subscriber::fmt()
    //     .with_env_filter("debug")   // RUST_LOG=debug 生效
    //     .init();
    app_lib::run();
}
