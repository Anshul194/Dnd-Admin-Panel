export default function Variant4({ productData }: { productData?: any }) {
  // Dummy data for when product doesn't have ingredients - matching code.html
  const dummyIngredients = [
    {
      name: "Arjun Chaal",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMuoYBOJIVpjNc5Kc30EQBP5zBrFz8V6UYoKrq2N8U5q9H-vAykr7M871_DGnHNa8hy7_8u8KiHqHgQmPe07IAsqvuf326vLYPK3sW-LI0_QktLCp14qWur611roM4CAFwLxWjKl9npJuhtKVPON0_S2Sp5ssEuhxDeO1RYGhn8buV0ax7YgX2hMbpvOgtR1VbhKIswzbiWov7VhlfkTvvc3U9UusePwRQ1Ypfj9Hjd9vzIjyOhqmDdPAYTLnGpb69mxaeaVWjlnXB",
      knownFor: "Heart Tonic",
      description: "Strengthens cardiac muscles & flow.",
    },
    {
      name: "Ashwagandha",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPAdZ3rdJlO3r24pzWQFy9gNqAiryb1RxCOXI_KJCCgzHZwHWdawyn4d_EJs704wfFRkndl5FAHVTwfiN8mrNKir3n01IGicSyZwTTOcJCnYp0QspwfUiGwrL4OiXRHLstdCdc620Smgk0ERRUzumaou0170LeKHzj1_xM9C8HExQvb3kNNOAToFbXbNaTM9ErIR-lp3NIjGaSXmmZ4NsIrdv_SUMh_LeIYV-ap3PB3af5VcKlDPvkpXXmHFUldJB4tyQWoemB7KRw",
      knownFor: "Stress Buster",
      description: "Reduces cortisol and anxiety.",
    },
    {
      name: "Amla",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzgZ2yhKyEKINAd3dMzXNb4Q4re55EFkUjNcHSzCmDni7SyUe-3Ac-IwXDFBanYlnNgpQJ3DLGw9jAPxKRV2MhlW4TpFeb0KTlrvJRKoPFknPUkFu9rv3QiSXoXa_flF6gKM6qDcDJ_yuTTnpoEjc0pP8XGWuFCV2aLi-eVkrg97QC8Nx92r0_DZIu1hZYyGMfTL3Mem_M-ZOUYfDLa22hIqGx_0nqsXHBAsTp-Ug0IIPKxCY0napmTxeT3fjoO_uCM5kzAyxADVes",
      knownFor: "Vitamin C Powerhouse",
      description: "Immunity and antioxidant support.",
    },
    {
      name: "Aloe Vera",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWTSW6byKPLpWS9XFuAz56l9VSjjz-amga34rg6mtog9p398i_gmOCcQ0OBspFyuy6CK1WsfKoGttw6NLfRLhtKTCeU7ZQ2VMYnR_yHDugzu7JZ1r8HpHqsjT3NS0LSIZDpxn1kkHB8tWTbKjzS0XZa5AF42vyYbcg90lelUYpqbDShUkzBDSK_hWb7TxJ46LvDuFksqjbMz1Uy6ms7Xm8jaOIk3AC2xhDbtURANVxQD4Tks8UdapWzWCRti-lOfl3a4LPrnNTj2rq",
      knownFor: "Gut Healer",
      description: "Soothes digestion and absorption.",
    },
    {
      name: "Panch Tulsi",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkieht3bCjHO_9CRryeWGft0wXIKbDR2XWWRSf5RzqgXTAdCh82J_JpFVo2HxH2VsudKbaxl9q4sQosaIjgrSa9_LNuxQqPf12PX_S612BMsbPRN39RdT9NDlG77CRlQAhAzPS1xu4GHOVojDYtmrX5jGWn6gyBFi-fnTd4TJP1oCvqUZDNqHTfWWQswkfuK9hJN9-X8FF7IZklKIISA8nZmSwqmT38GrfWrL2bte3IDUJ-kVTZJgpetwy865sFYvXEr3K3ODzFeib",
      knownFor: "Holy Basil Blend",
      description: "Respiratory health and detox.",
    },
  ];

  // Extract plain text from HTML
  const getPlainText = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  };

  // Process ingredients from API (Admin Panel uses direct URLs, no getImageUrl needed)
  const ingredients = productData?.ingredients?.map((ing: any) => ({
    name: ing.name?.trim() || "",
    image: ing.image || "",
    knownFor: ing.title || ing.name || "",
    description: getPlainText(ing.description) || "",
  })) || dummyIngredients;

  // Count ingredients for dynamic text
  const ingredientCount = ingredients.length;

  return (
    <div className="py-8 font-manrope">
      <h2 className="text-3xl font-bold text-center mb-4 text-veda-text-dark">
        What&apos;s inside the bottle?
      </h2>
      <p className="text-center text-veda-text-secondary mb-10">
        Transparent labelling. No hidden chemicals.
      </p>

      <div className="overflow-x-auto rounded-xl border border-[#e7f3eb]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fcf9] text-sm uppercase tracking-wider text-veda-text-secondary">
              <th className="p-4 font-bold border-b border-[#e7f3eb]">
                Ingredient
              </th>
              <th className="p-4 font-bold border-b border-[#e7f3eb]">
                Known For
              </th>
              <th className="p-4 font-bold border-b border-[#e7f3eb] hidden md:table-cell">
                Why it&apos;s here
              </th>
            </tr>
          </thead>
          <tbody className="text-sm md:text-base">
            {ingredients.map((ingredient: any, index: number) => (
              <tr
                key={index}
                className={`border-b border-[#e7f3eb] hover:bg-gray-50 transition-colors ${
                  index === ingredients.length - 1 ? "" : ""
                }`}
              >
                <td className="p-4 font-bold text-veda-text-dark flex items-center gap-3">
                  {ingredient.image && (
                    <img
                      alt={ingredient.name}
                      className="w-10 h-10 rounded-full object-cover shadow-sm"
                      src={ingredient.image}
                    />
                  )}
                  {ingredient.name}
                </td>
                <td className="p-4 text-gray-600">{ingredient.knownFor || ingredient.name}</td>
                <td className="p-4 text-gray-600 hidden md:table-cell">
                  {ingredient.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-veda-primary/10 p-6 rounded-xl flex items-start gap-4">
        <span className="text-green-700 text-3xl shrink-0">🧠</span>
        <div>
          <h3 className="font-bold text-lg mb-1 text-veda-text-dark">
            Why {ingredientCount} herbs together?
          </h3>
          <p className="text-sm text-gray-700">
            In Ayurveda, herbs work synergistically (Yoga Vahi). This blend combines{" "}
            {ingredients.map((ing: any, idx: number) => (
              <span key={idx}>
                <strong>{ing.name}</strong>
                {idx === ingredients.length - 1 ? "" : idx === ingredients.length - 2 ? " and " : ", "}
              </span>
            ))}{" "}
            to create a powerful formula for total body balance, not just one organ. Each herb amplifies the effects of others, working together to support heart health, reduce stress, improve digestion, and promote overall wellness.
          </p>
        </div>
      </div>
    </div>
  );
}
