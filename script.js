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
    if (showLoading) {
        LoadingScreen.style.display = "flex";
        SetLoading("Checking account...", 20);
    }

    const result = await WithTimeout(supabaseClient.auth.getUser(), 5000);

    if (result && result.timedOut) {
        Auth.style.display = "flex";
        ChatApp.style.display = "none";
        HideLoading();
        return;
    }

    CurrentUser = result.data ? result.data.user : null;

    if (!CurrentUser) {
        Auth.style.display = "flex";
        ChatApp.style.display = "none";
        HideLoading();
        return;
    }

    Auth.style.display = "none";
    ChatApp.style.display = "block";
    SetChatReadyState(false);

    if (showLoading) SetLoading("Loading chats and profile...", 50);

    const profileResult = await supabaseClient
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", CurrentUser.id)
        .maybeSingle();

    CurrentProfile = profileResult.data;

    const startup = Promise.allSettled([
        LoadUsers(),
        LoadStickers()
    ]);

    await WithTimeout(startup, 5000);

    SetSettingsProfile();

    if (showLoading) {
        SetLoading("Ready!", 100);
        setTimeout(HideLoading, 100);
    } else {
        HideLoading();
    }

    StartRealtime();
    StartPresence();
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
});

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