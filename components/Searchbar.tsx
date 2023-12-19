// use client side directive to render it into client component while everything else is server side rendered
"use client"

import { scrapeAndStoreProduct } from "@/lib/actions"
import { FormEvent, useState } from "react"

const isValidAmazonProductURL = (url: string) => {
    try {
        const parsedURL = new URL(url)
        const hostname = parsedURL.hostname

        //check if hostname is amazon.com or amazon.in
        if (
            hostname.includes('amazon.com') ||
            hostname.includes('amazon.') ||
            hostname.endsWith('amazon')) {
            return true;
        }
    } catch (error) {
        return false
    }

}

const Searchbar = () => {
    const [searchPrompt, setSearchPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const isValidLink = isValidAmazonProductURL(searchPrompt)
        // alert(isValidLink ? 'Valid Link' : 'Invalid Link') --> test if your link is valid or nah
        if (!isValidLink) return alert('Please provide a valid Amazon URL.')

        try {
            setIsLoading(true)

            //Scrape our first product
            const product = await scrapeAndStoreProduct(searchPrompt)
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <form
            className="flex flex-wrap gap-4 mt-12"
            onSubmit={handleSubmit}
        >
            <input
                type="text"
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                placeholder="Enter product link"
                className="searchbar-input"
            />

            <button
                type="submit"
                className="searchbar-btn"
                disabled={searchPrompt === ''}
            >
                {isLoading ? "Searching..." : "Search"}
            </button>
        </form>
    )
}

export default Searchbar