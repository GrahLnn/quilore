use cocoa::appkit::{NSApp, NSAppearance, NSWindow, NSWindowTitleVisibility, NSToolbar};
use cocoa::base::{id, nil, YES, NO};
use cocoa::foundation::{NSString, NSProcessInfo};
use objc::{class, msg_send, sel, sel_impl};

/// 隐藏 Title Bar，保留圆角和阴影
/// 如果 full_screen=true，则恢复原生 toolbar（用于全屏）
unsafe fn set_titlebar_style(window: id, full_screen: bool) {
    // 1. 让 titlebar 透明
    let () = msg_send![window, setTitlebarAppearsTransparent: YES];
    // 2. 根据是否全屏决定 toolbar
    if full_screen {
        // 全屏时删掉 toolbar，让系统接管
        let () = msg_send![window, setToolbar: nil];
    } else {
        // 非全屏时创建一个“隐形”toolbar，用来撑起交通灯布局
        let identifier = NSString::alloc(nil).init_str("invisible_toolbar");
        let toolbar: id = NSToolbar::alloc(nil).initWithIdentifier_(identifier);
        let () = msg_send![toolbar, setShowsBaselineSeparator: NO];
        let () = msg_send![window, setToolbar: toolbar];
    }
    // 3. 隐藏或显示 title 文本
    let visibility = if full_screen {
        NSWindowTitleVisibility::Visible
    } else {
        NSWindowTitleVisibility::Hidden
    };
    let () = msg_send![window, setTitleVisibility: visibility];
}

/// 禁用 App Nap
unsafe fn disable_app_nap(reason: &str) {
    let reason_ns = NSString::alloc(nil).init_str(reason);
    let process_info: id = msg_send![class!(NSProcessInfo), processInfo];
    // options: userInitiatedAllowingIdleSystemSleep
    let options = 1 << 20; // NSActivityUserInitiatedAllowingIdleSystemSleep
    let _: id = msg_send![
        process_info,
        beginActivityWithOptions: options
        reason: reason_ns
    ];
}

/// 恢复 App Nap
unsafe fn enable_app_nap() {
    let process_info: id = msg_send![class!(NSProcessInfo), processInfo];
    // 需要保存之前 beginActivity 返回的 token 才能 endActivity
    // 这里只演示用法，实际要把 token 存全局再释放
    let token: id = /* 从全局变量里取 */ nil;
    let _: () = msg_send![process_info, endActivity: token];
}

// fn main() {
//     // 这个地方举例在 Tauri 的 setup 里拿到 window.ns_window()
//     // 假设你已经有了 `ns_win: cocoa::appkit::NSWindow` 的 id
//     #[cfg(target_os = "macos")]
//     unsafe {
//         let ns_win: id = /* e.g. window.ns_window().unwrap() */;
//         set_titlebar_style(ns_win, false);
//         disable_app_nap("数据索引进行中");
//     }
// }
