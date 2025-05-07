use crate::domain::models::userkv::{get_userkv_value, UserKey};
use crate::domain::platform::twitter::auth::auth::{
    auth_generator_for, AuthGenerator, GuestAuth, UserAuth,
};
use crate::domain::platform::twitter::auth::enums::authentication::EAuthentication;
use crate::domain::platform::twitter::auth::models::credentials::AuthCredential;
use anyhow::Result;
use std::sync::Once;

// Initialize test environment
static INIT: Once = Once::new();
fn initialize() {
    INIT.call_once(|| {
        // Any one-time initialization code would go here
    });
}

#[tokio::test]
async fn test_guest_auth_generate() -> Result<()> {
    initialize();

    // Create a GuestAuth instance
    let auth = GuestAuth;

    // Call generate method
    let result = auth.generate().await;

    // Check if the result is Ok
    assert!(
        result.is_ok(),
        "GuestAuth generate failed: {:?}",
        result.err()
    );

    // Get the AuthCredential from the result
    let credential = result?;

    // Check that the guest_token is Some
    let headers = credential.headers();
    assert!(
        headers.contains_key("x-guest-token"),
        "Guest token header not found"
    );

    Ok(())
}

#[tokio::test]
async fn test_user_auth_generate() -> Result<()> {
    initialize();

    // Create a UserAuth instance
    let auth = UserAuth;

    // Call generate method
    let result = auth.generate().await;

    // The test might fail if no Twitter cookie is stored
    // We'll just check if the function runs without panicking
    match result {
        Ok(credential) => {
            // If we have a credential, check that it has the expected headers
            let headers = credential.headers();
            assert!(headers.contains_key("cookie"), "Cookie header not found");
            assert!(
                headers.contains_key("x-csrf-token"),
                "CSRF token header not found"
            );
        }
        Err(e) => {
            // If there's an error, it should be because no Twitter cookie was found
            println!("UserAuth generate failed as expected: {}", e);
            assert!(
                e.to_string().contains("No Twitter cookie found")
                    || e.to_string()
                        .contains("Failed to read stored Twitter cookie"),
                "Unexpected error: {}",
                e
            );
        }
    }

    Ok(())
}

#[test]
fn test_auth_generator_for() {
    initialize();

    // Test with Guest authentication type
    let guest_generator = auth_generator_for(EAuthentication::Guest);
    assert!(std::any::type_name_of_val(&*guest_generator).contains("GuestAuth"));

    // Test with User authentication type
    let user_generator = auth_generator_for(EAuthentication::User);
    assert!(std::any::type_name_of_val(&*user_generator).contains("UserAuth"));
}
