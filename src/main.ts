import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// MDUI 全量导入
import "mdui/mdui.css";
import "mdui";
import { setColorScheme, setTheme } from "mdui";

// Element Plus 全量导入
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

// Echarts 全量导入
// import "echarts";

const app = createApp(App);

app.use(router);
app.use(ElementPlus);

// 配色设置
setColorScheme("#78DC77");
// setTheme("auto");

app.mount("#app");
