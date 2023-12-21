// all cron related stuff will be within this file
//cron doesn't do anything new much, basically takes all the old jobs and somewhat combines them

import Product from "@/lib/models/product.model"
import { connectToDB } from "@/lib/mongoose"
import { generateEmailBody, sendEmail } from "@/lib/nodemailer"
import { scrapeAmazonProduct } from "@/lib/scraper"
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils"
import { NextResponse } from "next/server"
import { cursorTo } from "readline"

export const maxDuration = 10 //10 seconds since limit is 1-10
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
    try {
        connectToDB()

        const products = await Product.find({})

        if (!products) throw new Error("no products found")

        //1.scrape latest products details and update db

        //promise - to call multiple asynchronous actions
        const updatedProducts = await Promise.all(
            products.map(async (currentProduct) => { //map over all existing products


                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url)
                if (!scrapedProduct) throw new Error("No product found")

                const updatedPriceHistory = [
                    ...currentProduct.priceHistory,
                    {
                        price: scrapedProduct.currentPrice,
                    },
                ];

                const product = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory),
                };

                // Update Products in DB
                const updatedProduct = await Product.findOneAndUpdate(
                    {
                        url: product.url,
                    },
                    product
                );

                //2.send notification to subscribers after checking status of products accordingly
                const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct)

                if (emailNotifType && updatedProduct.users.length > 0) {
                    const productInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url
                    }

                    const emailContent = await generateEmailBody(productInfo, emailNotifType)
                    const userEmails = updatedProduct.users.map((user: any) => user.email)

                    await sendEmail(emailContent, userEmails)
                }
                return updatedProduct
            })
        )
        return NextResponse.json({
            message: "Ok",
            data: updatedProducts
        })
    } catch (error) {
        throw new Error(`Error in GET: ${error}`)
    }
}