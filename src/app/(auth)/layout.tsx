export const dynamic = "force-dynamic";

interface Props {
   children: React.ReactNode;
}

export default function layout({ children }: Props) {
   return (
      <div className=" min-h-screen flex items-center justify-center">
         {children}
      </div>
   );
}
