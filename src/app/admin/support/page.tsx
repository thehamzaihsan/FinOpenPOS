"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Copy } from "lucide-react"
import Image from "next/image"
import waImage from "@/images/wa.png"

export default function SupportPage() {
  const [copied, setCopied] = useState(false)
  const email = "thehamzaihsan@gmail.com"
  const whatsappNumber = "923057774991"
  const whatsappLink = `https://wa.me/${whatsappNumber}`

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Support Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2" />
              Email Support
            </CardTitle>
            <CardDescription>Send us an email for assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input value={email} readOnly />
              <Button variant="outline" size="icon" onClick={handleCopyEmail}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copied && <p className="text-sm text-green-500 mt-2">Email copied to clipboard!</p>}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => (window.location.href = `mailto:${email}`)}>
              Send Email
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2" />
              WhatsApp Support
            </CardTitle>
            <CardDescription>Contact us on WhatsApp for quick responses</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Image
              src={waImage}
              alt="WhatsApp QR Code"
              width={200}
              height={200}
              className="mb-4"
            />
            <p className="text-sm text-center mb-2">Scan this QR code with your phone camera to open WhatsApp</p>
            <p className="text-sm text-center mb-2">+{whatsappNumber}</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => window.open(whatsappLink, "_blank")}>
              Open WhatsApp
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* <Card className="mt-8">
        <CardHeader>
          <CardTitle>Send us a message</CardTitle>
          <CardDescription>We'll get back to you as soon as possible</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Input placeholder="Your Name" />
            </div>
            <div>
              <Input type="email" placeholder="Your Email" />
            </div>
            <div>
              <Textarea placeholder="Your Message" rows={4} />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Send Message</Button>
        </CardFooter>
      </Card> */}
    </div>
  )
}

