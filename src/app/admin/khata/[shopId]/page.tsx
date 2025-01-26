import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ShopPage({ params }: { params: { shopId: string } }) {
  







//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold">{shop.name}</h1>
//       <p className="text-gray-600">{shop.description}</p>

//       {/* Display products for this shop */}
//       <div className="mt-6">
//         <h2 className="text-xl font-semibold">Products</h2>
//         {products?.length ? (
//           <ul className="mt-4 space-y-2">
//             {products.map((product) => (
//               <li key={product.id} className="p-4 border rounded-lg">
//                 <h3 className="font-medium">{product.name}</h3>
//                 <p className="text-sm text-gray-600">{product.description}</p>
//                 <p className="text-sm text-gray-600">Price: ${product.price}</p>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-gray-500">No products found for this shop.</p>
//         )}
//       </div>
//     </div>
//   );
}