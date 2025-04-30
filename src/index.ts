import { login } from "./discord/index.js";

try {
    await login();
}
catch (err) {
    console.error(err);
}
