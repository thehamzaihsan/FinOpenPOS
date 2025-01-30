"use client"
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
interface userInfo{
    name:string;
    address:string;
    phoneNumber:string;
}
export default function UserCard(){
    const [info, setInfo] = useState<userInfo | null>();
    useEffect(() => {
        const fetchProducts = async () => {
          try {
            const response = await fetch("/api/profile");
            if (!response.ok) {
              throw new Error("Failed to fetch products");
            }
            const data = await response.json();
            setInfo(data);
            console.log(info);
          } catch (error) {
            console.error("Error fetching products:", error);
          } finally {
          }
        };
    
        fetchProducts();
      }, []);
    
    return <div className="print-only title ms-10 mb-2 mt-2">
        <span><h1 className="font-bold ">{info?.name}</h1></span>
        <br />
        <span><h1 className="font-bold ">{info?.address}</h1></span>
        <br />
        <span><h1 className="font-bold ">{info?.phoneNumber}</h1></span>
    </div>
}