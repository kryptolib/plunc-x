const express = require('express')
const app = express()
const port = 3000
const fs = require('fs')
const path = require('path')
const root = path.resolve(__dirname)

app.use(express.static('public'))

app.use(function(request, response){
    response.status(404)
    response.json({error:'Page Not Found'})
})

app.listen(port, () => {
    console.log(`app static listening on port ${port}`)
})