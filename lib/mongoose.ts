import mongoose from 'mongoose'

let isConnected = false //Variable to track our conn. status

export const connectToDB = async () => {
    mongoose.set('strictQuery', true) //just to ensure our application works well
    if(!process.env.MONGODB_URI) return console.log('MONGODB_URI is not defined')

    if(isConnected) return console.log('=> using existing DB connection')

    try {
        //testing DB connection
        await mongoose.connect(process.env.MONGODB_URI)
        isConnected = true
        console.log('MongoDB connected')
    } catch(error: any) {
        console.log(error)
    }
}