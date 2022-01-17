# Magic: the Gathering Price Fetcher 🦉

> Paste a csv of MTG card info, get prices back

I've been slowly selling my collection and wanted a simple way to get a list of prices for a list of cards, so I built a little web app.

## FAQ (that no one's asked yet)

# why dont you just use _app x_ to track prices

Originally I was using TCG player app to scan cards but from there I could not find anything easy to manage the list and get prices afterward.

It looks like I can import into a collection, but their UI options (from whwere I found it) was clunky and not easy to swap out. Ultimately I want this collection in Google Sheets anyway.

# Why csv text field and not file upload?

I didn't want to deal with file uploads on serverless nextjs so I went with a text field to paste into. I've been trying to do file upload on another Next project and it's more involved than a text field.

# why can I only fetch prices for unique 100 cards?

For now, I'm limiting the number of unique cards you can search by 100. I may add ip address limits too. I don't make scryfall sad by leting others use this and going nuts.

---

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
