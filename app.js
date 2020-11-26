const express = require("express")
const app = express()
const path = require("path")

app.use(express.static(__dirname + "/"))
app.use("/three/", express.static(path.join(__dirname, "node_modules/three/build")));
app.use("/build/", express.static(path.join(__dirname, "node_modules/three/build"))); // querreferenzen unter three.js
app.use("/dat/", express.static(path.join(__dirname, "node_modules/dat.gui/build")));
app.use("/jsm/", express.static(path.join(__dirname, "node_modules/three/examples/jsm")));

app.listen(8080, () => {
    console.log("Server is running");
});