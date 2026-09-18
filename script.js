const SUPABASE_URL = "https://nmlhudteeetfaucncgdc.supabase.co";
const SUPABASE_KEY = "sb_publishable_bfBMrwL2YDj53tbPxxu-Ow_bykMyc-h";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const LoadingScreen = document.getElementById("LoadingScreen");
const LoadingText = document.getElementById("LoadingText");
const LoadingProgress = document.getElementById("LoadingProgress");
const Auth = document.getElementById("Auth");
const ChatApp = document.getElementById("ChatApp");
const SignupPage = document.getElementById("SignupPage");
const LoginPage = document.getElementById("LoginPage");
const Username = document.getElementById("Username");
const Email = document.getElementById("Email");
const Password = document.getElementById("Password");
const LoginEmail = document.getElementById("LoginEmail");
const LoginPassword = document.getElementById("LoginPassword");
const Signup = document.getElementById("Signup");
const Login = document.getElementById("Login");
const ShowLogin = document.getElementById("ShowLogin");
const ShowSignup = document.getElementById("ShowSignup");
const UserList = document.getElementById("UserList");
const UserSearch = document.getElementById("UserSearch");
const ChatTitle = document.getElementById("ChatTitle");
const ChatStatus = document.getElementById("ChatStatus");
const ChatAvatar = document.getElementById("ChatAvatar");
const Messages = document.getElementById("Messages");
const Input = document.getElementById("Input");
const Send = document.getElementById("Send");
const FileButton = document.getElementById("FileButton");
const FileInput = document.getElementById("FileInput");
const StickerButton = document.getElementById("StickerButton");
const StickerPanel = document.getElementById("StickerPanel");
const ReplyBar = document.getElementById("ReplyBar");
const ReplyName = document.getElementById("ReplyName");
const ReplyText = document.getElementById("ReplyText");
const CancelReply = document.getElementById("CancelReply");
const SettingsButton = document.getElementById("SettingsButton");
const SettingsPanel = document.getElementById("SettingsPanel");
const CloseSettings = document.getElementById("CloseSettings");
const Logout = document.getElementById("Logout");
const AvatarFile = document.getElementById("AvatarFile");
const UploadAvatar = document.getElementById("UploadAvatar");
const ProfileUsername = document.getElementById("ProfileUsername");
const SaveProfile = document.getElementById("SaveProfile");
const SettingsAvatar = document.getElementById("SettingsAvatar");
const StickerFile = document.getElementById("StickerFile");
const UploadSticker = document.getElementById("UploadSticker");
const EnableNotifications = document.getElementById("EnableNotifications");
const MessageMenu = document.getElementById("MessageMenu");
const GroupList = document.getElementById("GroupList");
const NewGroup = document.getElementById("NewGroup");
const DeveloperButton = document.getElementById("DeveloperButton");
const DeveloperPanel = document.getElementById("DeveloperPanel");
const CloseDeveloper = document.getElementById("CloseDeveloper");
const DeveloperVerify = document.getElementById("DeveloperVerify");
const DeveloperPassword = document.getElementById("DeveloperPassword");
const VerifyDeveloper = document.getElementById("VerifyDeveloper");
const DeveloperVerifyStatus = document.getElementById("DeveloperVerifyStatus");
const DeveloperContent = document.getElementById("DeveloperContent");
const DevStats = document.getElementById("DevStats");
const DeveloperUsers = document.getElementById("DeveloperUsers");
const DeveloperUserSearch = document.getElementById("DeveloperUserSearch");
const DeveloperReports = document.getElementById("DeveloperReports");
const AnnouncementTitle = document.getElementById("AnnouncementTitle");
const AnnouncementBody = document.getElementById("AnnouncementBody");
const SendAnnouncement = document.getElementById("SendAnnouncement");
const RefreshDeveloper = document.getElementById("RefreshDeveloper");
const DeveloperSystemStatus = document.getElementById("DeveloperSystemStatus");
const ToggleRegistration = document.getElementById("ToggleRegistration");
const ToggleGroups = document.getElementById("ToggleGroups");
const MaintenanceToggle = document.getElementById("MaintenanceToggle");

let CurrentUser = null;
let CurrentProfile = null;
let CurrentChatUser = null;
let ReplyingTo = null;
let RealtimeStarted = false;
let PresenceChannel = null;
let OnlineUsers = new Set();
let MenuMessage = null;
let LoadedMessages = [];
let SearchTimer = null;
let CurrentGroup = null;
let GroupProfiles = new Map();
let DeveloperVerified = false;

function SetLoading(text, progress) {
    LoadingText.textContent = text;
    LoadingProgress.style.width = progress + "%";
}

function HideLoading() {
    LoadingScreen.style.display = "none";
}

function WithTimeout(promise, milliseconds) {
    return Promise.race([
        promise,
        new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), milliseconds))
    ]);
}

function SetDefaultAvatar(element) {
    element.replaceChildren();
    element.className = "DefaultAvatar";
    element.textContent = "👤";
}

function SetImageAvatar(element, url, className) {
    const image = document.createElement("img");
    image.className = className;
    image.src = url;
    image.alt = "";
    element.replaceChildren(image);
    element.className = className;
}

function SetChatHeader(user) {
    ChatTitle.textContent = user.username;
    ChatStatus.textContent = OnlineUsers.has(user.id) ? "Online" : "Offline";

    if (user.avatar_url) SetImageAvatar(ChatAvatar, user.avatar_url, "Avatar");
    else SetDefaultAvatar(ChatAvatar);
}

function SetSettingsProfile() {
    ProfileUsername.value = CurrentProfile ? CurrentProfile.username : "";
    if (CurrentProfile && CurrentProfile.avatar_url) {
        SetImageAvatar(SettingsAvatar, CurrentProfile.avatar_url, "Avatar");
    } else {
        SetDefaultAvatar(SettingsAvatar);
    }
}

function SetChatReadyState(ready) {
    Input.disabled = !ready;
    Send.disabled = !ready;
    StickerButton.disabled = !ready;
    FileButton.disabled = !ready;
}

function ShowChatPlaceholder() {
    Messages.replaceChildren();
    ChatTitle.textContent = "";
    ChatStatus.textContent = "";
    SetDefaultAvatar(ChatAvatar);
    SetChatReadyState(false);
}

ShowLogin.addEventListener("click", () => {
    SignupPage.style.display = "none";
    LoginPage.style.display = "block";
});

ShowSignup.addEventListener("click", () => {
    LoginPage.style.display = "none";
    SignupPage.style.display = "block";
});

Signup.addEventListener("click", async () => {
    if (!Username.value.trim() || !Email.value.trim() || !Password.value) {
        alert("Fill everything in.");
        return;
    }

    const { data: siteSetting } = await supabaseClient.from("site_settings")
        .select("value").eq("key","registration_enabled").maybeSingle();
    if (siteSetting?.value?.enabled === false) {
        alert("Registration is currently disabled.");
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: Email.value.trim(),
        password: Password.value
    });

    if (error) {
        alert(error.message);
        return;
    }

    if (!data.user) {
        alert("Account creation failed.");
        return;
    }

    const { error: profileError } = await supabaseClient.from("profiles").insert({
        id: data.user.id,
        username: Username.value.trim()
    });

    if (profileError) {
        alert(profileError.message);
        return;
    }

    await CheckUser(false);
});

Login.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signInWithPassword({
        email: LoginEmail.value.trim(),
        password: LoginPassword.value
    });

    if (error) {
        alert(error.message);
        return;
    }

    await CheckUser(false);
});

async function CheckUser(showLoading = true) {
    try {
        if (showLoading) {
            LoadingScreen.style.display = "flex";
            SetLoading("Checking account...", 20);
        }

        const result = await WithTimeout(supabaseClient.auth.getUser(), 5000);

        if (result && result.timedOut) {
            Auth.style.display = "flex";
            ChatApp.style.display = "none";
            return;
        }

        CurrentUser = result.data ? result.data.user : null;

        if (!CurrentUser) {
            Auth.style.display = "flex";
            ChatApp.style.display = "none";
            return;
        }

        Auth.style.display = "none";
        ChatApp.style.display = "block";
        SetChatReadyState(false);

        if (showLoading) SetLoading("Loading chats and profile...", 50);

        const profileResult = await WithTimeout(
            supabaseClient
                .from("profiles")
                .select("id, username, avatar_url")
                .eq("id", CurrentUser.id)
                .maybeSingle(),
            5000
        );

        if (profileResult && profileResult.timedOut) {
            CurrentProfile = null;
        } else {
            CurrentProfile = profileResult.data || null;
        }

        const startup = Promise.allSettled([
            LoadUsers(),
            LoadStickers()
        ]);

        await WithTimeout(startup, 5000);

        SetSettingsProfile();

        if (showLoading) {
            SetLoading("Ready!", 100);
            setTimeout(HideLoading, 100);
        }
    } catch (error) {
        console.error("Startup error:", error);
        Auth.style.display = CurrentUser ? "none" : "flex";
        ChatApp.style.display = CurrentUser ? "block" : "none";
    } finally {
        HideLoading();

        if (CurrentUser) {
            StartRealtime();
            StartPresence();
        }
    }
}

async function LoadUsers() {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, avatar_url")
        .order("username", { ascending: true });

    if (error) {
        console.log(error.message);
        return;
    }

    const { data: allMessages } = await supabaseClient
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .or("sender_id.eq." + CurrentUser.id + ",receiver_id.eq." + CurrentUser.id)
        .order("created_at", { ascending: false })
        .limit(500);

    const { data: reads } = await supabaseClient
        .from("message_reads")
        .select("other_user_id, last_read_at")
        .eq("user_id", CurrentUser.id);

    const readMap = new Map();
    for (const read of reads || []) readMap.set(read.other_user_id, read.last_read_at);

    const previewMap = new Map();
    const unreadMap = new Map();

    for (const message of allMessages || []) {
        const otherId = message.sender_id === CurrentUser.id
            ? message.receiver_id
            : message.sender_id;

        if (!previewMap.has(otherId)) previewMap.set(otherId, message);

        const lastRead = readMap.get(otherId);
        if (
            message.receiver_id === CurrentUser.id &&
            (!lastRead || new Date(message.created_at) > new Date(lastRead))
        ) {
            unreadMap.set(otherId, (unreadMap.get(otherId) || 0) + 1);
        }
    }

    const users = (data || []).filter(user => user.id !== CurrentUser.id);
    users.sort((a, b) => {
        const aDate = previewMap.get(a.id)?.created_at || "";
        const bDate = previewMap.get(b.id)?.created_at || "";
        if (aDate && bDate) return new Date(bDate) - new Date(aDate);
        if (aDate) return -1;
        if (bDate) return 1;
        return a.username.localeCompare(b.username);
    });

    UserList.replaceChildren();

    for (const user of users) {
        const person = document.createElement("div");
        person.className = "UserItem";
        person.dataset.userId = user.id;

        const avatar = document.createElement("div");
        if (user.avatar_url) SetImageAvatar(avatar, user.avatar_url, "UserAvatar");
        else SetDefaultAvatar(avatar);

        const info = document.createElement("div");
        info.className = "UserInfo";

        const name = document.createElement("span");
        name.className = "UserName";
        name.textContent = user.username;

        const preview = document.createElement("span");
        preview.className = "LastMessage";
        preview.textContent = MessagePreview(previewMap.get(user.id));

        info.appendChild(name);
        info.appendChild(preview);
        person.appendChild(avatar);
        person.appendChild(info);

        const unread = unreadMap.get(user.id) || 0;
        if (unread) {
            const badge = document.createElement("span");
            badge.className = "UnreadBadge";
            badge.textContent = unread > 99 ? "99+" : unread;
            person.appendChild(badge);
        }

        person.addEventListener("click", () => OpenChat(user));
        UserList.appendChild(person);
    }

    if (!CurrentChatUser) {
        const savedId = localStorage.getItem("messaging-last-chat");
        const savedUser = users.find(user => user.id === savedId);
        if (savedUser) OpenChat(savedUser);
        else if (users[0]) OpenChat(users[0]);
    } else {
        const updated = users.find(user => user.id === CurrentChatUser.id);
        if (updated) {
            CurrentChatUser = updated;
            SetChatHeader(updated);
        }
    }
}

function MessagePreview(item) {
    if (!item) return "No messages yet";
    if (!item.content) return "Message";
    if (item.content.startsWith("STICKER:")) return "Sticker";
    if (item.content.startsWith("FILE:")) {
        try {
            return "📎 " + JSON.parse(item.content.substring(5)).name;
        } catch {
            return "File";
        }
    }
    return item.content;
}

async function OpenChat(user) {
    CurrentChatUser = user;
    ReplyingTo = null;
    localStorage.setItem("messaging-last-chat", user.id);
    ReplyBar.style.display = "none";
    StickerPanel.style.display = "none";
    HideMessageMenu();

    document.querySelectorAll(".UserItem").forEach(item => {
        item.classList.toggle("Active", item.dataset.userId === user.id);
    });

    SetChatHeader(user);
    SetChatReadyState(true);

    await LoadMessages();
    await MarkChatRead();
    await LoadUsers();
    Input.focus();
}

function MessageBelongsToCurrentChat(item) {
    if (!CurrentUser || !CurrentChatUser) return false;

    return (
        (item.sender_id === CurrentUser.id && item.receiver_id === CurrentChatUser.id) ||
        (item.sender_id === CurrentChatUser.id && item.receiver_id === CurrentUser.id)
    );
}

async function LoadMessages(searchText = "") {
    if (!CurrentChatUser) return;

    const firstChat =
        "and(sender_id.eq." + CurrentUser.id +
        ",receiver_id.eq." + CurrentChatUser.id + ")";

    const secondChat =
        "and(sender_id.eq." + CurrentChatUser.id +
        ",receiver_id.eq." + CurrentUser.id + ")";

    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .or(firstChat + "," + secondChat)
        .order("created_at", { ascending: true });

    if (error) {
        console.log(error.message);
        return;
    }

    LoadedMessages = data || [];
    Messages.replaceChildren();

    const query = searchText.trim().toLowerCase();

    for (const item of LoadedMessages) {
        if (query && !SearchableMessage(item).toLowerCase().includes(query)) continue;
        AppendMessage(item);
    }

    ScrollToBottom();
}

function SearchableMessage(item) {
    if (item.content?.startsWith("STICKER:")) return "sticker";
    if (item.content?.startsWith("FILE:")) {
        try {
            return JSON.parse(item.content.substring(5)).name;
        } catch {
            return "file";
        }
    }
    return item.content || "";
}

function AppendMessage(item) {
    if (!MessageBelongsToCurrentChat(item)) return;

    const box = document.createElement("div");
    box.className = "MessageBox";
    box.dataset.messageId = item.id;
    box.classList.add(item.sender_id === CurrentUser.id ? "Sent" : "Received");

    const sender = document.createElement("p");
    sender.className = "SenderName";
    sender.textContent = item.sender_id === CurrentUser.id ? "You" : CurrentChatUser.username;
    box.appendChild(sender);

    if (item.reply_to) {
        const original = LoadedMessages.find(message => message.id === item.reply_to);
        const reply = document.createElement("div");
        reply.className = "ReplyPreview";
        reply.textContent = original ? "↩ " + MessagePreview(original) : "↩ Replied message";
        reply.addEventListener("click", () => JumpToMessage(item.reply_to));
        box.appendChild(reply);
    }

    const message = document.createElement("div");
    message.className = "Message";

    RenderMessageContent(message, item);

    if (item.edited) {
        const edited = document.createElement("span");
        edited.className = "Edited";
        edited.textContent = "(edited)";
        message.appendChild(edited);
    }

    box.appendChild(message);
    Messages.appendChild(box);

    box.addEventListener("contextmenu", event => {
        event.preventDefault();
        ShowMessageMenu(item, event.clientX, event.clientY);
    });

    let longPress;
    box.addEventListener("touchstart", event => {
        longPress = setTimeout(() => {
            const touch = event.touches[0];
            ShowMessageMenu(item, touch.clientX, touch.clientY);
        }, 600);
    });
    box.addEventListener("touchend", () => clearTimeout(longPress));
    box.addEventListener("touchmove", () => clearTimeout(longPress));
}

function RenderMessageContent(container, item) {
    if (item.content?.startsWith("STICKER:")) {
        const image = document.createElement("img");
        image.className = "StickerMessage";
        image.src = item.content.substring(8);
        image.alt = "Sticker";
        container.appendChild(image);
        return;
    }

    if (item.content?.startsWith("FILE:")) {
        let file;
        try {
            file = JSON.parse(item.content.substring(5));
        } catch {
            container.textContent = "File";
            return;
        }

        if (file.type?.startsWith("image/")) {
            const image = document.createElement("img");
            image.className = "AttachmentImage";
            image.src = file.url;
            image.alt = file.name;
            image.addEventListener("click", () => window.open(file.url, "_blank"));
            container.appendChild(image);
        } else if (file.type?.startsWith("audio/")) {
            const audio = document.createElement("audio");
            audio.className = "AttachmentAudio";
            audio.controls = true;
            audio.src = file.url;
            container.appendChild(audio);
        } else {
            const link = document.createElement("a");
            link.className = "FileLink";
            link.href = file.url;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = "📎 " + file.name;
            container.appendChild(link);
        }
        return;
    }

    container.textContent = item.content || "";
}

async function SendMessage() {
    if (!CurrentChatUser) return;

    const text = Input.value.trim();
    if (!text) return;

    const { error } = await supabaseClient.from("messages").insert({
        sender_id: CurrentUser.id,
        receiver_id: CurrentChatUser.id,
        content: text,
        reply_to: ReplyingTo ? ReplyingTo.id : null
    });

    if (error) {
        alert(error.message);
        return;
    }

    Input.value = "";
    AutoGrowInput();
    CancelReplyFunction();
    await LoadMessages();
}

Send.addEventListener("click", SendMessage);

Input.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        CancelReplyFunction();
        return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        SendMessage();
    }
});

Input.addEventListener("input", AutoGrowInput);

function AutoGrowInput() {
    Input.style.height = "auto";
    Input.style.height = Math.min(Input.scrollHeight, 120) + "px";
}

function StartReply(item) {
    ReplyingTo = item;
    ReplyBar.style.display = "flex";
    ReplyName.textContent = item.sender_id === CurrentUser.id ? "You" : CurrentChatUser.username;
    ReplyText.textContent = MessagePreview(item);
    Input.focus();
}

function CancelReplyFunction() {
    ReplyingTo = null;
    ReplyBar.style.display = "none";
    ReplyText.textContent = "";
}

CancelReply.addEventListener("click", CancelReplyFunction);

function JumpToMessage(id) {
    const target = Messages.querySelector('[data-message-id="' + id + '"]');
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.animate(
        [{ opacity: 0.35 }, { opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }],
        { duration: 700 }
    );
}

function ShowMessageMenu(item, x, y) {
    MenuMessage = item;

    MessageMenu.querySelector('[data-action="edit"]').style.display =
        item.sender_id === CurrentUser.id && !item.content?.startsWith("STICKER:") && !item.content?.startsWith("FILE:")
            ? "block"
            : "none";

    MessageMenu.querySelector('[data-action="delete"]').style.display =
        item.sender_id === CurrentUser.id ? "block" : "none";

    MessageMenu.style.display = "block";
    MessageMenu.style.left = Math.min(x, window.innerWidth - 160) + "px";
    MessageMenu.style.top = Math.min(y, window.innerHeight - 190) + "px";
}

function HideMessageMenu() {
    MessageMenu.style.display = "none";
    MenuMessage = null;
}

document.addEventListener("click", event => {
    if (!MessageMenu.contains(event.target)) HideMessageMenu();
});

MessageMenu.addEventListener("click", async event => {
    const button = event.target.closest("button");
    if (!button || !MenuMessage) return;

    const action = button.dataset.action;
    const item = MenuMessage;
    HideMessageMenu();

    if (action === "reply") StartReply(item);
    if (action === "copy") {
        const text = SearchableMessage(item);
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            alert("Copy is not available in this browser.");
        }
    }
    if (action === "edit") await EditMessage(item);
    if (action === "delete") await DeleteMessage(item);
});

async function EditMessage(item) {
    if (!item.content || item.content.startsWith("STICKER:") || item.content.startsWith("FILE:")) return;

    const newText = prompt("Edit message:", item.content);
    if (newText === null || !newText.trim()) return;

    const { error } = await supabaseClient
        .from("messages")
        .update({ content: newText.trim(), edited: true })
        .eq("id", item.id)
        .eq("sender_id", CurrentUser.id);

    if (error) {
        alert(error.message);
        return;
    }

    await LoadMessages(UserSearch.value);
}

async function DeleteMessage(item) {
    if (!confirm("Delete this message?")) return;

    const { error } = await supabaseClient
        .from("messages")
        .delete()
        .eq("id", item.id)
        .eq("sender_id", CurrentUser.id);

    if (error) {
        alert(error.message);
        return;
    }

    await LoadMessages(UserSearch.value);
    await LoadUsers();
}

function ScrollToBottom() {
    Messages.scrollTop = Messages.scrollHeight;
}

async function MarkChatRead() {
    if (!CurrentUser || !CurrentChatUser) return;

    const { error } = await supabaseClient.from("message_reads").upsert({
        user_id: CurrentUser.id,
        other_user_id: CurrentChatUser.id,
        last_read_at: new Date().toISOString()
    }, {
        onConflict: "user_id,other_user_id"
    });

    if (error) console.log(error.message);
}

SettingsButton.addEventListener("click", () => {
    SettingsPanel.style.display = SettingsPanel.style.display === "block" ? "none" : "block";
    if (SettingsPanel.style.display === "block") SetSettingsProfile();
});

CloseSettings.addEventListener("click", () => {
    SettingsPanel.style.display = "none";
});

async function UploadProfilePicture() {
    const file = AvatarFile.files[0];

    if (!file || !CurrentUser) {
        alert("Choose an image first.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Profile pictures must be under 5 MB.");
        return;
    }

    const extension = file.name.split(".").pop().toLowerCase();
    const path = CurrentUser.id + "/" + crypto.randomUUID() + "." + extension;

    const { error: uploadError } = await supabaseClient.storage
        .from("avatars")
        .upload(path, file, { upsert: false });

    if (uploadError) {
        alert(uploadError.message);
        return;
    }

    const { data } = supabaseClient.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", CurrentUser.id);

    if (updateError) {
        alert(updateError.message);
        return;
    }

    CurrentProfile.avatar_url = data.publicUrl;
    AvatarFile.value = "";
    await LoadUsers();
    SetSettingsProfile();
    alert("Profile picture updated!");
}

UploadAvatar.addEventListener("click", UploadProfilePicture);

SaveProfile.addEventListener("click", async () => {
    const username = ProfileUsername.value.trim();

    if (!username) {
        alert("Username cannot be empty.");
        return;
    }

    const { data, error } = await supabaseClient
        .from("profiles")
        .update({ username })
        .eq("id", CurrentUser.id)
        .select("id, username, avatar_url")
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    CurrentProfile = data;
    if (CurrentChatUser?.id === CurrentUser.id) SetChatHeader(data);
    await LoadUsers();
    SetSettingsProfile();
    alert("Profile saved!");
});

Logout.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    await supabaseClient.removeAllChannels();

    RealtimeStarted = false;
    PresenceChannel = null;

    CurrentUser = null;
    CurrentProfile = null;
    CurrentChatUser = null;
    OnlineUsers.clear();
    UserList.replaceChildren();
    Messages.replaceChildren();
    SettingsPanel.style.display = "none";
    ChatApp.style.display = "none";
    Auth.style.display = "flex";
    SignupPage.style.display = "block";
    LoginPage.style.display = "none";
});

document.querySelectorAll("#ThemeButtons button").forEach(button => {
    button.addEventListener("click", () => {
        const theme = button.dataset.theme;
        document.body.className = "theme-" + theme;
        localStorage.setItem("theme", theme);
    });
});

const SavedTheme = localStorage.getItem("theme");
if (SavedTheme) document.body.className = "theme-" + SavedTheme;

FileButton.addEventListener("click", () => {
    if (CurrentChatUser) FileInput.click();
});

FileInput.addEventListener("change", UploadAndSendFile);

async function UploadAndSendFile() {
    const file = FileInput.files[0];
    FileInput.value = "";

    if (!file || !CurrentUser || !CurrentChatUser) return;

    if (file.size > 10 * 1024 * 1024) {
        alert("Files must be under 10 MB.");
        return;
    }

    const path = CurrentUser.id + "/" + crypto.randomUUID() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const { error: uploadError } = await supabaseClient.storage
        .from("attachments")
        .upload(path, file);

    if (uploadError) {
        alert(uploadError.message);
        return;
    }

    const { data } = supabaseClient.storage.from("attachments").getPublicUrl(path);

    const attachment = {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        url: data.publicUrl
    };

    const { error } = await supabaseClient.from("messages").insert({
        sender_id: CurrentUser.id,
        receiver_id: CurrentChatUser.id,
        content: "FILE:" + JSON.stringify(attachment),
        reply_to: ReplyingTo ? ReplyingTo.id : null
    });

    if (error) {
        alert(error.message);
        return;
    }

    CancelReplyFunction();
    await LoadMessages();
}

UploadSticker.addEventListener("click", UploadNewSticker);

async function UploadNewSticker() {
    const file = StickerFile.files[0];

    if (!file || !CurrentUser) {
        alert("Choose a sticker image first.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Stickers must be under 5 MB.");
        return;
    }

    const extension = file.name.split(".").pop().toLowerCase();
    const path = CurrentUser.id + "/" + crypto.randomUUID() + "." + extension;

    const { error: uploadError } = await supabaseClient.storage
        .from("stickers")
        .upload(path, file);

    if (uploadError) {
        alert(uploadError.message);
        return;
    }

    const { data } = supabaseClient.storage.from("stickers").getPublicUrl(path);

    const { error } = await supabaseClient.from("stickers").insert({
        user_id: CurrentUser.id,
        url: data.publicUrl
    });

    if (error) {
        alert(error.message);
        return;
    }

    StickerFile.value = "";
    await LoadStickers();
    alert("Sticker uploaded!");
}

async function LoadStickers() {
    const { data, error } = await supabaseClient
        .from("stickers")
        .select("id, user_id, url")
        .order("id", { ascending: false });

    if (error) {
        console.log(error.message);
        return;
    }

    StickerPanel.replaceChildren();

    for (const sticker of data || []) {
        const image = document.createElement("img");
        image.className = "StickerChoice";
        image.src = sticker.url;
        image.alt = "Sticker";
        image.addEventListener("click", () => SendSticker(sticker.url));
        StickerPanel.appendChild(image);
    }
}

StickerButton.addEventListener("click", () => {
    if (!CurrentChatUser) return;
    StickerPanel.style.display = StickerPanel.style.display === "block" ? "none" : "block";
});

async function SendSticker(url) {
    if (!CurrentChatUser) return;

    const { error } = await supabaseClient.from("messages").insert({
        sender_id: CurrentUser.id,
        receiver_id: CurrentChatUser.id,
        content: "STICKER:" + url,
        reply_to: ReplyingTo ? ReplyingTo.id : null
    });

    if (error) {
        alert(error.message);
        return;
    }

    StickerPanel.style.display = "none";
    CancelReplyFunction();
    await LoadMessages();
}

UserSearch.addEventListener("input", () => {
    clearTimeout(SearchTimer);
    SearchTimer = setTimeout(() => {
        LoadMessages(UserSearch.value);
    }, 180);
});

function StartRealtime() {
    if (RealtimeStarted) return;
    RealtimeStarted = true;

    supabaseClient
        .channel("messages-live-v3")
        .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "messages"
        }, async payload => {
            if (MessageBelongsToCurrentChat(payload.new)) {
                LoadedMessages.push(payload.new);
                AppendMessage(payload.new);
                ScrollToBottom();
                if (payload.new.sender_id !== CurrentUser.id) {
                    await MarkChatRead();
                }
            }

            await LoadUsers();

            if (
                payload.new.receiver_id === CurrentUser.id &&
                payload.new.sender_id !== CurrentUser.id &&
                payload.new.sender_id !== CurrentChatUser?.id
            ) {
                NotifyNewMessage(payload.new);
            }
        })
        .on("postgres_changes", {
            event: "UPDATE",
            schema: "public",
            table: "messages"
        }, async payload => {
            if (MessageBelongsToCurrentChat(payload.new)) await LoadMessages(UserSearch.value);
            await LoadUsers();
        })
        .on("postgres_changes", {
            event: "DELETE",
            schema: "public",
            table: "messages"
        }, async payload => {
            if (MessageBelongsToCurrentChat(payload.old)) await LoadMessages(UserSearch.value);
            await LoadUsers();
        })
        .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "profiles"
        }, async () => {
            await LoadUsers();
        })
        .on("postgres_changes", {
            event: "UPDATE",
            schema: "public",
            table: "profiles"
        }, async () => {
            await LoadUsers();
        })
        .subscribe(status => {
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                console.log("Realtime unavailable. The app will still work normally.");
            }
        });
}

function StartPresence() {
    if (PresenceChannel || !CurrentUser) return;

    PresenceChannel = supabaseClient.channel("online-users-v3", {
        config: {
            presence: {
                key: CurrentUser.id
            }
        }
    });

    PresenceChannel
        .on("presence", { event: "sync" }, UpdatePresence)
        .on("presence", { event: "join" }, UpdatePresence)
        .on("presence", { event: "leave" }, UpdatePresence)
        .subscribe(async status => {
            if (status !== "SUBSCRIBED") return;
            await PresenceChannel.track({
                userId: CurrentUser.id,
                online_at: new Date().toISOString()
            });
        });
}

function UpdatePresence() {
    if (!PresenceChannel) return;

    const state = PresenceChannel.presenceState();
    OnlineUsers = new Set();

    for (const key of Object.keys(state)) {
        for (const presence of state[key] || []) {
            if (presence.userId) OnlineUsers.add(presence.userId);
        }
    }

    document.querySelectorAll(".UserItem").forEach(item => {
        const id = item.dataset.userId;
        let dot = item.querySelector(".StatusDot");

        if (!dot) {
            dot = document.createElement("span");
            dot.className = "StatusDot";
            item.querySelector(".UserName")?.appendChild(dot);
        }

        dot.classList.toggle("Online", OnlineUsers.has(id));
    });

    if (CurrentChatUser) SetChatHeader(CurrentChatUser);
}

EnableNotifications.addEventListener("click", async () => {
    if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") alert("Notifications enabled!");
    else alert("Notifications were not enabled.");
});

function NotifyNewMessage(item) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const sender = document.querySelector('[data-user-id="' + item.sender_id + '"] .UserName')?.textContent || "New message";
    new Notification(sender, {
        body: MessagePreview(item)
    });
}

ShowChatPlaceholder();
CheckUser(true);
/* ================= V4 GROUP CHATS ================= */

async function LoadGroupsV4() {
    if (!CurrentUser || !GroupList) return;
    const { data: memberships, error } = await supabaseClient.from("group_members")
        .select("group_id,role").eq("user_id",CurrentUser.id);
    if (error) { console.log("Groups:",error.message); return; }

    const ids=(memberships||[]).map(x=>x.group_id);
    GroupList.replaceChildren();
    if (!ids.length) {
        const e=document.createElement("p"); e.className="LastMessage"; e.textContent="No groups yet"; GroupList.appendChild(e); return;
    }

    const {data:groups,error:groupError}=await supabaseClient.from("groups")
        .select("id,name,avatar_url,owner_id,created_at").in("id",ids).order("created_at",{ascending:false});
    if(groupError){console.log("Groups:",groupError.message);return;}

    for(const group of groups||[]){
        const item=document.createElement("div");
        item.className="GroupItem"; item.dataset.groupId=group.id;
        const icon=document.createElement("div"); icon.className="GroupIcon"; icon.textContent="👥";
        const info=document.createElement("div"); info.className="GroupInfo";
        const name=document.createElement("span"); name.className="GroupName"; name.textContent=group.name;
        const meta=document.createElement("span"); meta.className="GroupMeta"; meta.textContent=group.owner_id===CurrentUser.id?"Owner":"Group";
        info.append(name,meta); item.append(icon,info); item.onclick=()=>OpenGroupV4(group); GroupList.appendChild(item);
    }
}

async function OpenGroupV4(group) {
    CurrentGroup=group; CurrentChatUser=null; ReplyingTo=null;
    localStorage.setItem("messaging-last-group",group.id);
    ReplyBar.style.display="none"; StickerPanel.style.display="none"; HideMessageMenu();
    document.querySelectorAll(".UserItem,.GroupItem").forEach(x=>x.classList.remove("Active"));
    document.querySelector('.GroupItem[data-group-id="'+group.id+'"]')?.classList.add("Active");
    ChatTitle.textContent=group.name; ChatStatus.textContent="Group chat";
    SetDefaultAvatar(ChatAvatar); SetChatReadyState(true);
    await LoadGroupMessagesV4(); Input.focus();
}

async function LoadGroupMessagesV4(searchText="") {
    if(!CurrentUser||!CurrentGroup)return;
    const {data,error}=await supabaseClient.from("messages").select("*")
        .eq("group_id",CurrentGroup.id).order("created_at",{ascending:true});
    if(error){console.log("Group messages:",error.message);return;}
    LoadedMessages=data||[]; GroupProfiles.clear();
    const ids=[...new Set(LoadedMessages.map(x=>x.sender_id))];
    if(ids.length){
        const {data:profiles}=await supabaseClient.from("profiles").select("id,username,avatar_url").in("id",ids);
        for(const p of profiles||[])GroupProfiles.set(p.id,p);
    }
    Messages.replaceChildren();
    const q=searchText.trim().toLowerCase();
    for(const item of LoadedMessages){
        if(q&&!SearchableMessage(item).toLowerCase().includes(q))continue;
        AppendGroupMessageV4(item);
    }
    ScrollToBottom();
}

function AppendGroupMessageV4(item) {
    if(!CurrentGroup||item.group_id!==CurrentGroup.id)return;
    if(Messages.querySelector('[data-message-id="'+item.id+'"]'))return;
    const box=document.createElement("div");
    box.className="MessageBox"; box.dataset.messageId=item.id;
    box.classList.add(item.sender_id===CurrentUser.id?"Sent":"Received");
    const sender=document.createElement("p"); sender.className="SenderName";
    sender.textContent=item.sender_id===CurrentUser.id?"You":(GroupProfiles.get(item.sender_id)?.username||"Member");
    box.appendChild(sender);
    if(item.reply_to){
        const original=LoadedMessages.find(x=>x.id===item.reply_to);
        const reply=document.createElement("div"); reply.className="ReplyPreview";
        reply.textContent=original?"↩ "+MessagePreview(original):"↩ Replied message";
        reply.onclick=()=>JumpToMessage(item.reply_to); box.appendChild(reply);
    }
    const message=document.createElement("div"); message.className="Message";
    RenderMessageContent(message,item);
    if(item.edited){const e=document.createElement("span");e.className="Edited";e.textContent="(edited)";message.appendChild(e);}
    box.appendChild(message);Messages.appendChild(box);
    box.oncontextmenu=e=>{e.preventDefault();ShowMessageMenu(item,e.clientX,e.clientY);};
}

const V4OriginalLoadMessages=LoadMessages;
LoadMessages=async function(searchText=""){
    if(CurrentGroup){await LoadGroupMessagesV4(searchText);return;}
    await V4OriginalLoadMessages(searchText);
};

const V4OriginalSendMessage=SendMessage;
SendMessage=async function(){
    if(!CurrentGroup){await V4OriginalSendMessage();return;}
    const text=Input.value.trim();if(!text)return;
    const {error}=await supabaseClient.from("messages").insert({
        sender_id:CurrentUser.id,receiver_id:null,group_id:CurrentGroup.id,
        content:text,reply_to:ReplyingTo?ReplyingTo.id:null
    });
    if(error){alert(error.message);return;}
    Input.value="";AutoGrowInput();CancelReplyFunction();await LoadGroupMessagesV4();
};

const V4OriginalFileHandler=UploadAndSendFile;
UploadAndSendFile=async function(){
    if(!CurrentGroup){await V4OriginalFileHandler();return;}
    const file=FileInput.files[0];FileInput.value="";
    if(!file)return;
    if(file.size>10*1024*1024)return alert("Files must be under 10 MB.");
    const path=CurrentUser.id+"/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const {error:uploadError}=await supabaseClient.storage.from("attachments").upload(path,file);
    if(uploadError)return alert(uploadError.message);
    const {data}=supabaseClient.storage.from("attachments").getPublicUrl(path);
    const attachment={name:file.name,type:file.type||"application/octet-stream",size:file.size,url:data.publicUrl};
    const {error}=await supabaseClient.from("messages").insert({
        sender_id:CurrentUser.id,receiver_id:null,group_id:CurrentGroup.id,
        content:"FILE:"+JSON.stringify(attachment),reply_to:ReplyingTo?ReplyingTo.id:null
    });
    if(error)return alert(error.message);
    CancelReplyFunction();await LoadGroupMessagesV4();
};

const V4OriginalSticker=SendSticker;
SendSticker=async function(url){
    if(!CurrentGroup){await V4OriginalSticker(url);return;}
    const {error}=await supabaseClient.from("messages").insert({
        sender_id:CurrentUser.id,receiver_id:null,group_id:CurrentGroup.id,
        content:"STICKER:"+url,reply_to:ReplyingTo?ReplyingTo.id:null
    });
    if(error)return alert(error.message);
    StickerPanel.style.display="none";CancelReplyFunction();await LoadGroupMessagesV4();
};

NewGroup?.addEventListener("click",async()=>{
    if(!CurrentUser)return;
    const {data:groupSetting}=await supabaseClient.from("site_settings").select("value").eq("key","groups_enabled").maybeSingle();
    if(groupSetting?.value?.enabled===false){alert("Groups are currently disabled.");return;}
    const name=prompt("Group name:");if(!name?.trim())return;
    const names=(prompt("Member usernames, separated by commas:")||"").split(",").map(x=>x.trim()).filter(Boolean);
    const {data:group,error}=await supabaseClient.from("groups")
        .insert({name:name.trim(),owner_id:CurrentUser.id}).select("id,name,avatar_url,owner_id,created_at").single();
    if(error)return alert(error.message);
    const members=[{group_id:group.id,user_id:CurrentUser.id,role:"owner"}];
    if(names.length){
        const {data:profiles}=await supabaseClient.from("profiles").select("id,username").in("username",names);
        for(const p of profiles||[])if(p.id!==CurrentUser.id)members.push({group_id:group.id,user_id:p.id,role:"member"});
    }
    const {error:memberError}=await supabaseClient.from("group_members").insert(members);
    if(memberError){await supabaseClient.from("groups").delete().eq("id",group.id);return alert(memberError.message);}
    await LoadGroupsV4();await OpenGroupV4(group);
});

const V4OriginalLoadUsers=LoadUsers;
LoadUsers=async function(){await V4OriginalLoadUsers();await LoadGroupsV4();};

const V4OriginalCheckUser=CheckUser;
CheckUser=async function(showLoading=true){
    await V4OriginalCheckUser(showLoading);
    if(CurrentUser){await LoadGroupsV4();await SetupDeveloperV4();}
};

/* ================= V4 FRIENDS ================= */

async function FriendStatusV4(userId){
    if(!CurrentUser||userId===CurrentUser.id)return "self";
    const {data:friend}=await supabaseClient.from("friendships").select("friend_id").eq("user_id",CurrentUser.id).eq("friend_id",userId).maybeSingle();
    if(friend)return "friend";
    const {data:out}=await supabaseClient.from("friend_requests").select("id,status").eq("sender_id",CurrentUser.id).eq("receiver_id",userId).eq("status","pending").maybeSingle();
    if(out)return "sent";
    const {data:incoming}=await supabaseClient.from("friend_requests").select("id,status").eq("sender_id",userId).eq("receiver_id",CurrentUser.id).eq("status","pending").maybeSingle();
    if(incoming)return "incoming";
    return "none";
}

async function SendFriendRequestV4(userId){
    const status=await FriendStatusV4(userId);if(status!=="none")return;
    const {error}=await supabaseClient.from("friend_requests").insert({sender_id:CurrentUser.id,receiver_id:userId,status:"pending"});
    if(error)alert(error.message);else{alert("Friend request sent!");await LoadUsers();}
}

async function DecorateFriendsV4(){
    document.querySelectorAll(".UserItem").forEach(item=>{
        const userId=item.dataset.userId;
        if(userId===CurrentUser?.id||item.querySelector(".FriendButton"))return;
        const button=document.createElement("button");button.className="FriendButton";button.textContent="👥";
        button.title="Add friend";button.onclick=async e=>{e.stopPropagation();await SendFriendRequestV4(userId);};
        item.appendChild(button);
    });
}

async function RefreshFriendButtonsV4(){
    for(const item of document.querySelectorAll(".UserItem")){
        const id=item.dataset.userId;const status=await FriendStatusV4(id);
        const button=item.querySelector(".FriendButton");if(!button)continue;
        button.textContent=status==="friend"?"✓":status==="sent"?"⏳":status==="incoming"?"📩":"👥";
        button.title=status==="friend"?"Friend":status==="sent"?"Request sent":status==="incoming"?"Accept incoming request":"Add friend";
        if(status==="incoming")button.onclick=async e=>{e.stopPropagation();await AcceptFriendRequestV4(id);};
    }
}

async function AcceptFriendRequestV4(senderId){
    const {data:req}=await supabaseClient.from("friend_requests").select("id").eq("sender_id",senderId).eq("receiver_id",CurrentUser.id).eq("status","pending").maybeSingle();
    if(!req)return;
    await supabaseClient.from("friend_requests").update({status:"accepted"}).eq("id",req.id);
    await supabaseClient.from("friendships").upsert([{user_id:CurrentUser.id,friend_id:senderId},{user_id:senderId,friend_id:CurrentUser.id}],{onConflict:"user_id,friend_id"});
    alert("Friend request accepted!");
    await LoadUsers();
}

const V4DecorateLoad=LoadUsers;
LoadUsers=async function(){await V4DecorateLoad();await DecorateFriendsV4();await RefreshFriendButtonsV4();};

/* ================= V4 DEVELOPER PANEL ================= */

async function IsDeveloperV4(){
    if(!CurrentUser)return false;
    const {data}=await supabaseClient.from("site_roles").select("role").eq("user_id",CurrentUser.id).maybeSingle();
    return data?.role==="developer";
}
async function SetupDeveloperV4(){
    if(DeveloperButton)DeveloperButton.style.display=(await IsDeveloperV4())?"block":"none";
}
DeveloperButton?.addEventListener("click",()=>{
    DeveloperPanel.style.display="block";DeveloperVerify.style.display="block";DeveloperContent.style.display="none";
    DeveloperPassword.value="";DeveloperVerifyStatus.textContent="";DeveloperVerified=false;
});
CloseDeveloper?.addEventListener("click",()=>{
    DeveloperPanel.style.display="none";DeveloperVerified=false;DeveloperPassword.value="";
});
VerifyDeveloper?.addEventListener("click",async()=>{
    if(!(await IsDeveloperV4()))return DeveloperVerifyStatus.textContent="Developer access denied.";
    if(!DeveloperPassword.value)return DeveloperVerifyStatus.textContent="Enter your account password.";
    const {data,error}=await supabaseClient.auth.signInWithPassword({email:CurrentUser.email,password:DeveloperPassword.value});
    if(error||!data?.user||data.user.id!==CurrentUser.id)return DeveloperVerifyStatus.textContent="Verification failed.";
    DeveloperVerified=true;DeveloperVerify.style.display="none";DeveloperContent.style.display="block";
    DeveloperVerifyStatus.textContent="Verified.";await LoadDeveloperV4();
});
async function LoadDeveloperV4(){
    if(!DeveloperVerified)return;
    const [{data:users},{data:groups},{data:reports},{count:messageCount}]=await Promise.all([
        supabaseClient.from("profiles").select("id,username,avatar_url"),
        supabaseClient.from("groups").select("id,name,owner_id,created_at"),
        supabaseClient.from("reports").select("*").order("created_at",{ascending:false}).limit(50),
        supabaseClient.from("messages").select("*",{count:"exact",head:true})
    ]);
    DevStats.innerHTML='<div class="DevStat"><strong>'+(users?.length||0)+'</strong>Users</div><div class="DevStat"><strong>'+(messageCount||0)+'</strong>Messages</div><div class="DevStat"><strong>'+(groups?.length||0)+'</strong>Groups</div><div class="DevStat"><strong>'+OnlineUsers.size+'</strong>Online</div>';
    const filter=DeveloperUserSearch.value.trim().toLowerCase();DeveloperUsers.replaceChildren();
    for(const u of (users||[]).filter(x=>x.username.toLowerCase().includes(filter))){
        const row=document.createElement("div");row.className="DevUser";row.textContent=u.username+(u.id===CurrentUser.id?" (you)":"");DeveloperUsers.appendChild(row);
    }
    DeveloperReports.replaceChildren();
    for(const r of reports||[]){
        const row=document.createElement("div");row.className="DevReport";row.textContent="Report "+r.id.slice(0,8)+" — "+r.reason+" — "+r.status;
        if(r.status==="open"){const b=document.createElement("button");b.textContent="Resolve";b.onclick=async()=>{await supabaseClient.from("reports").update({status:"resolved"}).eq("id",r.id);await LoadDeveloperV4();};row.appendChild(b);}
        DeveloperReports.appendChild(row);
    }
    const {data:settings}=await supabaseClient.from("site_settings").select("key,value");
    const map=new Map((settings||[]).map(x=>[x.key,x.value]));
    DeveloperSystemStatus.innerHTML="Database: 🟢 reachable<br>Realtime: "+(RealtimeStarted?"🟢 started":"🟡 not started")+"<br>Presence: "+(PresenceChannel?"🟢 started":"🟡 not started")+"<br>Groups: "+(map.get("groups_enabled")?.enabled===false?"🔴 disabled":"🟢 enabled")+"<br>Registration: "+(map.get("registration_enabled")?.enabled===false?"🔴 disabled":"🟢 enabled")+"<br>Maintenance: "+(map.get("maintenance_mode")?.enabled===true?"🟠 ON":"🟢 OFF");
}
RefreshDeveloper?.addEventListener("click",LoadDeveloperV4);
DeveloperUserSearch?.addEventListener("input",()=>{clearTimeout(window.devTimer);window.devTimer=setTimeout(LoadDeveloperV4,150);});
SendAnnouncement?.addEventListener("click",async()=>{
    if(!DeveloperVerified)return;
    const title=AnnouncementTitle.value.trim(),body=AnnouncementBody.value.trim();
    if(!title||!body)return alert("Enter a title and message.");
    const {error}=await supabaseClient.from("site_announcements").insert({title,body,created_by:CurrentUser.id,active:true});
    if(error)return alert(error.message);AnnouncementTitle.value="";AnnouncementBody.value="";alert("Announcement published!");
});
async function ToggleSiteV4(key){
    const {data}=await supabaseClient.from("site_settings").select("value").eq("key",key).maybeSingle();
    const enabled=data?.value?.enabled===true;
    const {error}=await supabaseClient.from("site_settings").upsert({key,value:{enabled:!enabled},updated_by:CurrentUser.id,updated_at:new Date().toISOString()});
    if(error)alert(error.message);else await LoadDeveloperV4();
}
ToggleRegistration?.addEventListener("click",()=>ToggleSiteV4("registration_enabled"));
ToggleGroups?.addEventListener("click",()=>ToggleSiteV4("groups_enabled"));
MaintenanceToggle?.addEventListener("click",()=>ToggleSiteV4("maintenance_mode"));

/* Group-aware realtime append */
const V4Belongs=MessageBelongsToCurrentChat;
MessageBelongsToCurrentChat=function(item){
    if(CurrentGroup)return item.group_id===CurrentGroup.id;
    return V4Belongs(item);
};

if(typeof SetupDeveloperV4==="function")SetupDeveloperV4();
if(CurrentUser)LoadGroupsV4();

/* ================= V4 FINAL POLISH ================= */
const ProfileBio=document.getElementById("ProfileBio");
const FriendRequestsButton=document.getElementById("FriendRequestsButton");
const FriendModal=document.getElementById("FriendModal");
const CloseFriends=document.getElementById("CloseFriends");
const FriendRequestsList=document.getElementById("FriendRequestsList");
const ProfileModal=document.getElementById("ProfileModal");
const CloseProfile=document.getElementById("CloseProfile");
const ProfileModalAvatar=document.getElementById("ProfileModalAvatar");
const ProfileModalName=document.getElementById("ProfileModalName");
const ProfileModalBio=document.getElementById("ProfileModalBio");
const ProfileModalMeta=document.getElementById("ProfileModalMeta");
const SearchModal=document.getElementById("SearchModal");
const CloseSearch=document.getElementById("CloseSearch");
const GlobalSearchInput=document.getElementById("GlobalSearchInput");
const GlobalSearchResults=document.getElementById("GlobalSearchResults");
const ImageViewer=document.getElementById("ImageViewer");
const CloseImage=document.getElementById("CloseImage");
const ViewerImage=document.getElementById("ViewerImage");
const Announcements=document.getElementById("Announcements");
const TypingStatus=document.getElementById("TypingStatus");

if(ProfileBio && CurrentProfile) ProfileBio.value=CurrentProfile.bio||"";

async function ShowProfileV4(userId){
    const {data:p}=await supabaseClient.from("profiles").select("id,username,avatar_url,bio").eq("id",userId).maybeSingle();
    if(!p)return;
    ProfileModalAvatar.replaceChildren();
    SetAvatarElement(ProfileModalAvatar,p.avatar_url);
    ProfileModalName.textContent=p.username||"User";
    ProfileModalBio.textContent=p.bio||"No bio yet.";
    ProfileModalBio.className="ProfileBio";
    const status=OnlineUsers.has(userId)?"🟢 Online":"⚪ Offline";
    ProfileModalMeta.textContent=status;
    ProfileModal.style.display="flex";
}
CloseProfile?.addEventListener("click",()=>ProfileModal.style.display="none");
ProfileModal?.addEventListener("click",e=>{if(e.target===ProfileModal)ProfileModal.style.display="none";});

async function LoadFriendRequestsV4(){
    if(!CurrentUser)return;
    const {data,error}=await supabaseClient.from("friend_requests")
      .select("id,sender_id,status,created_at").eq("receiver_id",CurrentUser.id).eq("status","pending").order("created_at",{ascending:false});
    if(error){FriendRequestsList.textContent=error.message;return;}
    FriendRequestsList.replaceChildren();
    if(!data?.length){FriendRequestsList.textContent="No pending requests.";return;}
    for(const r of data){
        const {data:p}=await supabaseClient.from("profiles").select("username").eq("id",r.sender_id).maybeSingle();
        const row=document.createElement("div");row.className="RequestRow";
        const name=document.createElement("span");name.textContent=p?.username||"User";
        const b=document.createElement("button");b.textContent="Accept";
        b.onclick=async()=>{await AcceptFriendRequestV4(r.sender_id);await LoadFriendRequestsV4();};
        row.append(name,b);FriendRequestsList.appendChild(row);
    }
}
FriendRequestsButton?.addEventListener("click",async()=>{FriendModal.style.display="flex";await LoadFriendRequestsV4();});
CloseFriends?.addEventListener("click",()=>FriendModal.style.display="none");

async function SaveProfileBioV4(){
    if(!CurrentUser||!ProfileBio)return;
    const bio=ProfileBio.value.trim().slice(0,160);
    const {error}=await supabaseClient.from("profiles").update({bio}).eq("id",CurrentUser.id);
    if(error)return alert(error.message);
    if(CurrentProfile)CurrentProfile.bio=bio;
    alert("Profile saved!");
}
const oldSaveProfile=SaveProfile.onclick;
SaveProfile.addEventListener("click",SaveProfileBioV4);

async function LoadAnnouncementsV4(){
    if(!CurrentUser||!Announcements)return;
    const {data}=await supabaseClient.from("site_announcements").select("id,title,body,created_at").eq("active",true).order("created_at",{ascending:false}).limit(3);
    Announcements.replaceChildren();
    for(const a of data||[]){
        const box=document.createElement("div");box.className="Announcement";
        const title=document.createElement("strong");title.textContent=a.title;
        const body=document.createElement("span");body.textContent=a.body;
        box.append(title,body);Announcements.appendChild(box);
    }
}
async function CheckMaintenanceV4(){
    if(!CurrentUser)return false;
    const {data}=await supabaseClient.from("site_settings").select("value").eq("key","maintenance_mode").maybeSingle();
    const on=data?.value?.enabled===true;
    if(on && !(await IsDeveloperV4())){
        document.body.innerHTML='<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Arial;color:white;background:#111"><div style="text-align:center"><h1>🛠️ Maintenance</h1><p>The website is temporarily unavailable.</p></div></div>';
        return true;
    }
    return false;
}

let TypingChannel=null,TypingTimer=null,OtherTyping=false;
function StartTypingV4(){
    if(!CurrentUser)return;
    if(!TypingChannel){
        TypingChannel=supabaseClient.channel("typing-v4");
        TypingChannel.on("broadcast",{event:"typing"},({payload})=>{
            if(!payload||payload.userId===CurrentUser.id)return;
            const relevant=CurrentGroup?payload.groupId===CurrentGroup.id:(!payload.groupId&&payload.userId===CurrentChatUser?.id);
            if(!relevant)return;
            OtherTyping=true;TypingStatus.textContent="typing...";
            clearTimeout(TypingTimer);TypingTimer=setTimeout(()=>{OtherTyping=false;TypingStatus.textContent="";},1800);
        }).subscribe();
    }
}
Input?.addEventListener("input",()=>{
    if(!CurrentUser||!TypingChannel)return;
    clearTimeout(window.typingSendTimer);
    window.typingSendTimer=setTimeout(()=>TypingChannel.send({type:"broadcast",event:"typing",payload:{userId:CurrentUser.id,groupId:CurrentGroup?.id||null}}),120);
});
StartTypingV4();

async function GlobalSearchV4(q){
    if(!CurrentUser||!q.trim())return;
    const {data,error}=await supabaseClient.from("messages").select("id,sender_id,receiver_id,group_id,content,created_at").ilike("content","%"+q.trim()+"%").order("created_at",{ascending:false}).limit(100);
    GlobalSearchResults.replaceChildren();
    if(error){GlobalSearchResults.textContent=error.message;return;}
    for(const m of data||[]){
        const row=document.createElement("div");row.className="SearchResult";
        const textContent=String(m.content||"").replace(/^FILE:.*$/,"[file]").slice(0,160);
        const date=new Date(m.created_at).toLocaleString();
        const heading=document.createElement("strong");heading.textContent=m.group_id?"Group message":"Message";
        const body=document.createElement("span");body.textContent=textContent;
        const small=document.createElement("small");small.textContent=date;
        row.append(heading,document.createElement("br"),body,document.createElement("br"),small);
        row.onclick=async()=>{
            if(m.group_id){
                const {data:g}=await supabaseClient.from("groups").select("id,name,avatar_url,owner_id,created_at").eq("id",m.group_id).maybeSingle();
                if(g){await OpenGroupV4(g);setTimeout(()=>JumpToMessage(m.id),100);}
            }else{
                const other=m.sender_id===CurrentUser.id?m.receiver_id:m.sender_id;
                const {data:u}=await supabaseClient.from("profiles").select("id,username,avatar_url").eq("id",other).maybeSingle();
                if(u){await OpenChat(u);setTimeout(()=>JumpToMessage(m.id),100);}
            }
            SearchModal.style.display="none";
        };
        GlobalSearchResults.appendChild(row);
    }
}
UserSearch.addEventListener("dblclick",()=>{SearchModal.style.display="flex";GlobalSearchInput.focus();});
GlobalSearchInput?.addEventListener("input",()=>{clearTimeout(window.globalSearchTimer);window.globalSearchTimer=setTimeout(()=>GlobalSearchV4(GlobalSearchInput.value),250);});
CloseSearch?.addEventListener("click",()=>SearchModal.style.display="none");

Messages.addEventListener("click",e=>{
    const img=e.target.closest(".AttachmentImage");
    if(img){ViewerImage.src=img.src;ImageViewer.style.display="flex";}
});
CloseImage?.addEventListener("click",()=>{ImageViewer.style.display="none";ViewerImage.src="";});

async function TogglePinV4(item){
    const {data:existing}=await supabaseClient.from("pinned_messages").select("message_id").eq("message_id",item.id).maybeSingle();
    if(existing) await supabaseClient.from("pinned_messages").delete().eq("message_id",item.id);
    else await supabaseClient.from("pinned_messages").insert({message_id:item.id,pinned_by:CurrentUser.id});
    alert(existing?"Message unpinned.":"Message pinned.");
}

async function ReportMessageV4(item){
    const reason=prompt("Reason for report:");
    if(!reason?.trim())return;
    const {error}=await supabaseClient.from("reports").insert({
        reporter_id:CurrentUser.id,reported_user_id:item.sender_id,message_id:item.id,
        group_id:item.group_id||null,reason:reason.trim(),status:"open"
    });
    if(error)alert(error.message);else alert("Report submitted.");
}

document.getElementById("MessageMenu")?.addEventListener("click",async e=>{
    const action=e.target.closest("button")?.dataset.action;
    if(!MenuMessage)return;
    if(action==="pin")await TogglePinV4(MenuMessage);
    if(action==="report")await ReportMessageV4(MenuMessage);
});

async function AddGroupMemberV4(){
    if(!CurrentGroup||CurrentGroup.owner_id!==CurrentUser.id)return alert("Only the group owner can add members.");
    const name=prompt("Username to add:");
    if(!name?.trim())return;
    const {data:p}=await supabaseClient.from("profiles").select("id,username").eq("username",name.trim()).maybeSingle();
    if(!p)return alert("User not found.");
    const {error}=await supabaseClient.from("group_members").insert({group_id:CurrentGroup.id,user_id:p.id,role:"member"});
    if(error)alert(error.message);else alert("Member added!");
}
function AddGroupControlsV4(){
    let b=document.getElementById("GroupManageButton");
    if(!b){b=document.createElement("button");b.id="GroupManageButton";b.textContent="👥";b.title="Add group member";b.onclick=AddGroupMemberV4;document.getElementById("ChatHeader")?.appendChild(b);}
    b.style.display=CurrentGroup&&CurrentGroup.owner_id===CurrentUser?.id?"block":"none";
}
const oldOpenGroupV4=OpenGroupV4;
OpenGroupV4=async function(group){await oldOpenGroupV4(group);AddGroupControlsV4();};
const oldOpenChatV4=OpenChat;
OpenChat=async function(user){CurrentGroup=null;await oldOpenChatV4(user);AddGroupControlsV4();};

document.addEventListener("dblclick",e=>{
    const item=e.target.closest(".UserItem");
    if(item?.dataset.userId)ShowProfileV4(item.dataset.userId);
});

const oldSetupDeveloper=SetupDeveloperV4;
SetupDeveloperV4=async function(){await oldSetupDeveloper();};

(async()=>{
    if(CurrentUser){
        await LoadAnnouncementsV4();
        if(await CheckMaintenanceV4())return;
        StartTypingV4();
        if(ProfileBio && CurrentProfile)ProfileBio.value=CurrentProfile.bio||"";
    }
})();

/* V4 settings enforcement and group controls */
async function EnforceSiteSettingsV4(){
    if(!CurrentUser)return;
    const {data:settings}=await supabaseClient.from("site_settings").select("key,value");
    const map=new Map((settings||[]).map(x=>[x.key,x.value]));
    const groupsOn=map.get("groups_enabled")?.enabled!==false;
    if(NewGroup)NewGroup.style.display=groupsOn?"block":"none";
    const registrationOn=map.get("registration_enabled")?.enabled!==false;
    if(SignupPage)SignupPage.style.display=registrationOn?(LoginPage.style.display==="none"?"block":SignupPage.style.display):"none";
    await LoadAnnouncementsV4();
}
supabaseClient.auth.onAuthStateChange((event,session)=>{
    if(session?.user){
        setTimeout(async()=>{CurrentUser=session.user;await EnforceSiteSettingsV4();await CheckMaintenanceV4();},0);
    }
});

async function LeaveGroupV4(){
    if(!CurrentGroup||!CurrentUser)return;
    if(CurrentGroup.owner_id===CurrentUser.id){
        if(!confirm("Delete this group? As the owner, leaving will remove the group."))return;
        const {error}=await supabaseClient.from("groups").delete().eq("id",CurrentGroup.id);
        if(error)return alert(error.message);
    }else{
        if(!confirm("Leave this group?"))return;
        const {error}=await supabaseClient.from("group_members").delete().eq("group_id",CurrentGroup.id).eq("user_id",CurrentUser.id);
        if(error)return alert(error.message);
    }
    CurrentGroup=null;Messages.replaceChildren();await LoadGroupsV4();
}
function AddGroupControlsV4Final(){
    let b=document.getElementById("GroupManageButton");
    if(!b)return;
    b.textContent=CurrentGroup&&CurrentGroup.owner_id===CurrentUser?.id?"👥":"🚪";
    b.title=CurrentGroup&&CurrentGroup.owner_id===CurrentUser?.id?"Add group member":"Leave group";
    b.onclick=CurrentGroup&&CurrentGroup.owner_id===CurrentUser?.id?AddGroupMemberV4:LeaveGroupV4;
}
const previousAddGroupControls=AddGroupControlsV4;
AddGroupControlsV4=()=>{previousAddGroupControls();AddGroupControlsV4Final();};

const previousNewGroup=NewGroup?.onclick;
if(NewGroup)NewGroup.addEventListener("click",async e=>{
    const {data}=await supabaseClient.from("site_settings").select("value").eq("key","groups_enabled").maybeSingle();
    if(data?.value?.enabled===false){e.stopImmediatePropagation();alert("Groups are currently disabled.");}
},true);

EnforceSiteSettingsV4();
