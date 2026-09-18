const SUPABASE_URL = "https://nmlhudteeetfaucncgdc.supabase.co";
const SUPABASE_KEY = "sb_publishable_bfBMrwL2YDj53tbPxxu-Ow_bykMyc-h";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

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
const ChatTitle = document.getElementById("ChatTitle");
const ChatAvatar = document.getElementById("ChatAvatar");
const Messages = document.getElementById("Messages");

const Input = document.getElementById("Input");
const Send = document.getElementById("Send");
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
const StickerFile = document.getElementById("StickerFile");
const UploadSticker = document.getElementById("UploadSticker");

let CurrentUser = null;
let CurrentChatUser = null;
let ReplyingTo = null;
let RealtimeStarted = false;

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
        new Promise(resolve => {
            setTimeout(() => resolve({ timedOut: true }), milliseconds);
        })
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

    if (user.avatar_url) {
        SetImageAvatar(ChatAvatar, user.avatar_url, "Avatar");
    } else {
        SetDefaultAvatar(ChatAvatar);
    }
}

function SetChatReadyState(ready) {
    Input.disabled = !ready;
    Send.disabled = !ready;
    StickerButton.disabled = !ready;
}

function ShowChatPlaceholder() {
    Messages.replaceChildren();
    ChatTitle.textContent = "";
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

    const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert({
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

    const result = await WithTimeout(
        supabaseClient.auth.getUser(),
        5000
    );

    if (result && result.timedOut) {
        console.log("Supabase account check timed out.");
        Auth.style.display = "flex";
        ChatApp.style.display = "none";
        HideLoading();
        return;
    }

    const { data, error } = result;

    if (error) {
        console.log(error.message);
    }

    CurrentUser = data ? data.user : null;

    if (!CurrentUser) {
        Auth.style.display = "flex";
        ChatApp.style.display = "none";
        HideLoading();
        return;
    }

    Auth.style.display = "none";
    ChatApp.style.display = "block";

    SetChatReadyState(false);

    if (showLoading) {
        SetLoading("Loading chats and stickers...", 50);
    }

    const startup = Promise.allSettled([
        LoadUsers(true),
        LoadStickers()
    ]);

    const startupResult = await WithTimeout(startup, 5000);

    if (startupResult && startupResult.timedOut) {
        console.log("Startup data is taking too long. Continuing anyway.");
    }

    if (showLoading) {
        SetLoading("Ready!", 100);
        setTimeout(HideLoading, 100);
    } else {
        HideLoading();
    }

    StartRealtime();
}

async function LoadUsers(openFirstChat = false) {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, avatar_url")
        .order("username", { ascending: true });

    if (error) {
        console.log(error.message);
        return;
    }

    UserList.replaceChildren();

    const seenUsers = new Set();
    let firstUser = null;

    for (const user of data) {
        if (user.id === CurrentUser.id || seenUsers.has(user.id)) {
            continue;
        }

        seenUsers.add(user.id);

        if (!firstUser) {
            firstUser = user;
        }

        const person = document.createElement("div");
        person.className = "UserItem";
        person.dataset.userId = user.id;

        const avatar = document.createElement("div");

        if (user.avatar_url) {
            SetImageAvatar(avatar, user.avatar_url, "UserAvatar");
        } else {
            SetDefaultAvatar(avatar);
            avatar.classList.add("UserAvatar");
        }

        const name = document.createElement("span");
        name.className = "UserName";
        name.textContent = user.username;

        person.appendChild(avatar);
        person.appendChild(name);

        person.addEventListener("click", () => OpenChat(user));

        UserList.appendChild(person);
    }

    if (openFirstChat && firstUser) {
        OpenChat(firstUser);
    }
}

async function OpenChat(user) {
    CurrentChatUser = user;
    ReplyingTo = null;
    ReplyBar.style.display = "none";
    StickerPanel.style.display = "none";

    document.querySelectorAll(".UserItem").forEach(item => {
        item.classList.toggle("Active", item.dataset.userId === user.id);
    });

    SetChatHeader(user);
    SetChatReadyState(true);

    await LoadMessages();
    Input.focus();
}

function MessageBelongsToCurrentChat(item) {
    if (!CurrentUser || !CurrentChatUser) {
        return false;
    }

    return (
        (item.sender_id === CurrentUser.id &&
            item.receiver_id === CurrentChatUser.id) ||
        (item.sender_id === CurrentChatUser.id &&
            item.receiver_id === CurrentUser.id)
    );
}

async function LoadMessages() {
    if (!CurrentChatUser) {
        return;
    }

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

    Messages.replaceChildren();

    for (const item of data) {
        AppendMessage(item);
    }

    ScrollToBottom();
}

function AppendMessage(item) {
    if (!MessageBelongsToCurrentChat(item)) {
        return;
    }

    if (Messages.querySelector('[data-message-id="' + item.id + '"]')) {
        return;
    }

    const box = document.createElement("div");
    box.className = "MessageBox";
    box.dataset.messageId = item.id;

    const sender = document.createElement("p");
    sender.className = "SenderName";
    sender.textContent =
        item.sender_id === CurrentUser.id
            ? "You"
            : CurrentChatUser.username;

    box.appendChild(sender);

    if (item.reply_to) {
        const reply = document.createElement("div");
        reply.className = "ReplyPreview";
        reply.textContent = "Reply";
        box.appendChild(reply);
    }

    const message = document.createElement("p");
    message.className = "Message";

    if (item.content && item.content.startsWith("STICKER:")) {
        const image = document.createElement("img");
        image.className = "StickerMessage";
        image.src = item.content.substring(8);
        image.alt = "Sticker";
        message.appendChild(image);
    } else {
        message.textContent = item.content || "";
    }

    if (item.sender_id === CurrentUser.id) {
        box.classList.add("Sent");
    } else {
        box.classList.add("Received");
    }

    if (item.edited) {
        const edited = document.createElement("span");
        edited.className = "Edited";
        edited.textContent = "(edited)";
        message.appendChild(edited);
    }

    box.appendChild(message);

    const actions = document.createElement("div");
    actions.className = "MessageActions";

    const replyButton = document.createElement("button");
    replyButton.textContent = "↩";
    replyButton.title = "Reply";
    replyButton.addEventListener("click", () => StartReply(item));
    actions.appendChild(replyButton);

    if (item.sender_id === CurrentUser.id) {
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => EditMessage(item));

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => DeleteMessage(item));

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
    }

    box.appendChild(actions);
    Messages.appendChild(box);
}

async function SendMessage() {
    if (!CurrentChatUser) return;

    const text = Input.value.trim();

    if (!text) return;

    const { error } = await supabaseClient
        .from("messages")
        .insert({
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
    CancelReplyFunction();
    await LoadMessages();
}

Send.addEventListener("click", SendMessage);

Input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        SendMessage();
    }
});

function StartReply(item) {
    ReplyingTo = item;
    ReplyBar.style.display = "flex";

    ReplyName.textContent =
        item.sender_id === CurrentUser.id
            ? "You"
            : CurrentChatUser.username;

    ReplyText.textContent =
        item.content && item.content.startsWith("STICKER:")
            ? "Sticker"
            : item.content;

    Input.focus();
}

function CancelReplyFunction() {
    ReplyingTo = null;
    ReplyBar.style.display = "none";
    ReplyText.textContent = "";
}

CancelReply.addEventListener("click", CancelReplyFunction);

async function EditMessage(item) {
    if (!item.content || item.content.startsWith("STICKER:")) {
        return;
    }

    const newText = prompt("Edit message:", item.content);

    if (newText === null || !newText.trim()) {
        return;
    }

    const { error } = await supabaseClient
        .from("messages")
        .update({
            content: newText.trim(),
            edited: true
        })
        .eq("id", item.id)
        .eq("sender_id", CurrentUser.id);

    if (error) {
        alert(error.message);
        return;
    }

    await LoadMessages();
}

async function DeleteMessage(item) {
    if (!confirm("Delete this message?")) {
        return;
    }

    const { error } = await supabaseClient
        .from("messages")
        .delete()
        .eq("id", item.id)
        .eq("sender_id", CurrentUser.id);

    if (error) {
        alert(error.message);
        return;
    }

    await LoadMessages();
}

function ScrollToBottom() {
    Messages.scrollTop = Messages.scrollHeight;
}

SettingsButton.addEventListener("click", () => {
    SettingsPanel.style.display =
        SettingsPanel.style.display === "block"
            ? "none"
            : "block";
});

CloseSettings.addEventListener("click", () => {
    SettingsPanel.style.display = "none";
});

Logout.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert(error.message);
        return;
    }

    CurrentUser = null;
    CurrentChatUser = null;
    UserList.replaceChildren();
    Messages.replaceChildren();
    SettingsPanel.style.display = "none";
    ChatApp.style.display = "none";
    Auth.style.display = "flex";
    SignupPage.style.display = "block";
    LoginPage.style.display = "none";
});

UploadAvatar.addEventListener("click", UploadProfilePicture);

async function UploadProfilePicture() {
    const file = AvatarFile.files[0];

    if (!file || !CurrentUser) {
        alert("Choose an image first.");
        return;
    }

    const extension =
        file.name.split(".").pop().toLowerCase();

    const path =
        CurrentUser.id + "/" +
        crypto.randomUUID() + "." +
        extension;

    const { error: uploadError } = await supabaseClient.storage
        .from("avatars")
        .upload(path, file, { upsert: false });

    if (uploadError) {
        alert(uploadError.message);
        return;
    }

    const { data } = supabaseClient.storage
        .from("avatars")
        .getPublicUrl(path);

    const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", CurrentUser.id);

    if (updateError) {
        alert(updateError.message);
        return;
    }

    AvatarFile.value = "";
    await LoadUsers(false);

    alert("Profile picture updated!");
}

document.querySelectorAll("#ThemeButtons button").forEach(button => {
    button.addEventListener("click", () => {
        const theme = button.dataset.theme;
        document.body.className = "theme-" + theme;
        localStorage.setItem("theme", theme);
    });
});

const SavedTheme = localStorage.getItem("theme");

if (SavedTheme) {
    document.body.className = "theme-" + SavedTheme;
}

UploadSticker.addEventListener("click", UploadNewSticker);

async function UploadNewSticker() {
    const file = StickerFile.files[0];

    if (!file || !CurrentUser) {
        alert("Choose a sticker image first.");
        return;
    }

    const extension =
        file.name.split(".").pop().toLowerCase();

    const path =
        CurrentUser.id + "/" +
        crypto.randomUUID() + "." +
        extension;

    const { error: uploadError } = await supabaseClient.storage
        .from("stickers")
        .upload(path, file);

    if (uploadError) {
        alert(uploadError.message);
        return;
    }

    const { data } = supabaseClient.storage
        .from("stickers")
        .getPublicUrl(path);

    const { error } = await supabaseClient
        .from("stickers")
        .insert({
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

    for (const sticker of data) {
        const image = document.createElement("img");
        image.className = "StickerChoice";
        image.src = sticker.url;
        image.alt = "Sticker";

        image.addEventListener("click", () => {
            SendSticker(sticker.url);
        });

        StickerPanel.appendChild(image);
    }
}

StickerButton.addEventListener("click", () => {
    if (!CurrentChatUser) return;

    StickerPanel.style.display =
        StickerPanel.style.display === "block"
            ? "none"
            : "block";
});

async function SendSticker(url) {
    if (!CurrentChatUser) return;

    const { error } = await supabaseClient
        .from("messages")
        .insert({
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

function StartRealtime() {
    if (RealtimeStarted) return;
    RealtimeStarted = true;

    supabaseClient
        .channel("messages-live")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages"
            },
            payload => {
                if (!MessageBelongsToCurrentChat(payload.new)) {
                    return;
                }

                AppendMessage(payload.new);
                ScrollToBottom();
            }
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "messages"
            },
            async payload => {
                if (MessageBelongsToCurrentChat(payload.new)) {
                    await LoadMessages();
                }
            }
        )
        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "messages"
            },
            async payload => {
                if (MessageBelongsToCurrentChat(payload.old)) {
                    await LoadMessages();
                }
            }
        )
        .subscribe(status => {
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                console.log("Realtime unavailable. The app will still work normally.");
            }
        });
}

ShowChatPlaceholder();
CheckUser(true);