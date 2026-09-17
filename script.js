const supabaseUrl = "https://nmlhudteeetfaucncgdc.supabase.co"
const supabaseKey = "sb_publishable_bfBMrwL2YDj53tbPxxu-Ow_bykMyc-h"

const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
)


// ---------- AUTH ELEMENTS ----------

const Auth = document.getElementById("Auth")
const ChatApp = document.getElementById("ChatApp")

const SignupPage = document.getElementById("SignupPage")
const LoginPage = document.getElementById("LoginPage")

const Email = document.getElementById("Email")
const Password = document.getElementById("Password")
const Username = document.getElementById("Username")
const Signup = document.getElementById("Signup")

const LoginEmail = document.getElementById("LoginEmail")
const LoginPassword = document.getElementById("LoginPassword")
const Login = document.getElementById("Login")

const ShowLogin = document.getElementById("ShowLogin")
const ShowSignup = document.getElementById("ShowSignup")
const Logout = document.getElementById("Logout")


// ---------- CHAT ELEMENTS ----------

const UserList = document.getElementById("UserList")
const ChatTitle = document.querySelector("#Chat h2")
const Input = document.getElementById("Input")
const Send = document.getElementById("Send")
const Messages = document.getElementById("Messages")


// ---------- CURRENT CHAT ----------

let CurrentChatUser = null


// ---------- INITIAL SCREEN ----------

ChatApp.style.display = "none"
LoginPage.style.display = "none"


// ---------- SIGNUP / LOGIN TOGGLE ----------

ShowLogin.addEventListener("click", function() {

    SignupPage.style.display = "none"
    LoginPage.style.display = "block"

})


ShowSignup.addEventListener("click", function() {

    LoginPage.style.display = "none"
    SignupPage.style.display = "block"

})


// ---------- SIGN UP ----------

Signup.addEventListener("click", async function() {

    const { data, error } = await supabaseClient.auth.signUp({
        email: Email.value,
        password: Password.value
    })

    if (error) {
        console.log(error.message)
        return
    }

    const user = data.user

    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .insert({
            id: user.id,
            username: Username.value
        })

    if (profileError) {
        console.log(profileError.message)
        return
    }

    Auth.style.display = "none"
    ChatApp.style.display = "block"

    LoadUsers()

})


// ---------- LOGIN ----------

Login.addEventListener("click", async function() {

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: LoginEmail.value,
        password: LoginPassword.value
    })

    console.log("DATA:", data)
    console.log("ERROR:", error)

    if (!error) {
        Auth.style.display = "none"
        ChatApp.style.display = "block"

        LoadUsers()
    }

})


// ---------- CHECK LOGIN ----------

async function CheckUser() {

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (user) {

        Auth.style.display = "none"
        ChatApp.style.display = "block"

        console.log("Logged in:", user.email)

        LoadUsers()

    } else {

        Auth.style.display = "block"
        ChatApp.style.display = "none"

    }

}


// ---------- LOAD USERS ----------

async function LoadUsers() {

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username")

    if (error) {
        console.log(error.message)
        return
    }

    UserList.innerHTML = ""

    const { data: { user: currentUser } } = await supabaseClient.auth.getUser()

    for (let user of data) {

        // Don't show yourself in the chat list

        if (user.id === currentUser.id) {
            continue
        }

        let person = document.createElement("p")

        person.textContent = user.username

        person.addEventListener("click", function() {
            OpenChat(user)
        })

        UserList.appendChild(person)

    }

}


// ---------- OPEN CHAT ----------

async function OpenChat(user) {

    CurrentChatUser = user

    ChatTitle.textContent = user.username

    console.log("Opened chat with:", user.username)
    console.log("User ID:", user.id)

    LoadMessages()

}


// ---------- LOAD MESSAGES ----------

async function LoadMessages() {

    if (!CurrentChatUser) {
        return
    }

    const { data: { user } } = await supabaseClient.auth.getUser()

    const firstChat = "and(sender_id.eq." + user.id + ",receiver_id.eq." + CurrentChatUser.id + ")"

    const secondChat = "and(sender_id.eq." + CurrentChatUser.id + ",receiver_id.eq." + user.id + ")"

    const filter = firstChat + "," + secondChat

    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .or(filter)

    if (error) {
        console.log(error)
        return
    }

    Messages.innerHTML = ""

    for (let item of data) {

        let message = document.createElement("p")

        message.textContent = item.content

        Messages.appendChild(message)

    }

}


// ---------- SEND MESSAGE ----------

Send.addEventListener("click", async function() {

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!CurrentChatUser) {
        console.log("No chat selected")
        return
    }

    if (Input.value === "") {
        return
    }

    const { data, error } = await supabaseClient
        .from("messages")
        .insert({
            sender_id: user.id,
            receiver_id: CurrentChatUser.id,
            content: Input.value
        })

    console.log("DATA:", data)
    console.log("ERROR:", error)

    if (!error) {
        Input.value = ""
        LoadMessages()
    }

})


// ---------- ENTER TO SEND ----------

Input.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        Send.click()
    }

})


// ---------- LOG OUT ----------

Logout.addEventListener("click", async function() {

    const { error } = await supabaseClient.auth.signOut()

    if (error) {
        console.log(error.message)
        return
    }

    CurrentChatUser = null

    CheckUser()

})


// ---------- START APP ----------

CheckUser()
