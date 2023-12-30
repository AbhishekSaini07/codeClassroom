const express = require("express");
const app =  express();
const port = 9000;
app.use("/",(req,res) => {
    res.json({message: "Abhishek Hello!"});
})
app.listen(port, () => {
console.log(`Starting Server at port ${port}`);
});