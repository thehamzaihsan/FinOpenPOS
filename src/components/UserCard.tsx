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
      const response = await fetch("/api/profile", {
        headers: {
          "x-pb-email": localStorage.getItem("pb_admin_email") || "",
          "x-pb-password": localStorage.getItem("pb_admin_password") || "",
        }
      });
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
  
  return <div className="print-only title mb-6">
    <span><h1 className="font-bold ">{info?.name}</h1></span>
    <span><h1 className="font-bold ">{info?.address}</h1></span>
    <span><h1 className="font-bold ">{info?.phoneNumber}</h1></span>
  </div>
}