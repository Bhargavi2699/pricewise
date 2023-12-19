import axios from "axios"
import * as cheerio from "cheerio"
import { exportTraceState } from "next/dist/trace"
import { extractCurrency, extractDescription, extractPrice } from "../utils"

export async function scrapeAmazonProduct(url: string) {
    if (!url) return

    //define the port

    //brightData proxy config
    const username = String(process.env.BRIGHT_DATA_USERNAME)
    const password = String(process.env.BRIGHT_DATA_PASSWORD)
    const port = 22225
    const session_id = (1000000 * Math.random()) | 0

    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password,
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
    }
    //make a request to get data from BrightData
    try {
        //fetch product page from Amazon
        //axios makes API calls, cheerio can parse through HTML & XML
        const response = await axios.get(url, options)
        // variable should be $ when cheerio is being used
        const $ = cheerio.load(response.data)

        //Extract product title
        const title = $('#productTitle').text().trim();
        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('.a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
        );

        //change below for .in and .com
        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
            // $('.a-size-small.aok-offscreen')
        );

        const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable'

        const images =
            $('#imgBlkFront').attr('data-a-dynamic-image') ||
            $('#landingImage').attr('data-a-dynamic-image') ||
            '{}'

        const imageUrls = Object.keys(JSON.parse(images))

        const currency = extractCurrency($('.a-price-symbol'))

        const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "")

        const description = extractDescription($)

        //construct data object with scraped info
        const data = {
            url,
            currency: currency  || '$', //check this one for .com || '₹'
            image: imageUrls[0],
            title,
            currentPrice: Number(currentPrice) || Number(originalPrice), //check this one for .com
            originalPrice: Number(originalPrice) || Number(currentPrice), 
            priceHistory: [],
            discountRate: Number(discountRate),
            category: 'category', //try this later
            reviewsCount: 100, //try this later
            stars: 4.5, //try this later
            isOutOfStock: outOfStock,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice), //check this one for .com
            highestPrice: Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice), //check this one for .com
        }
        return data;
        // console.log({ title, currentPrice, originalPrice, outOfStock, imageUrls, currency, discountRate });
    } catch (error: any) {
        throw new Error(`Failed to scrape product: ${error.message}`)
    }
}