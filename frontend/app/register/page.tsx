import { RegisterForm } from "@/components/RegisterForm";
import { Suspense } from "react";

export default function RegisterPage() {
	return (
		<div className="min-h-screen grid place-items-center px-6 sm:px-10 md:px-14 lg:px-20">
			<Suspense fallback={<div />}>
				<RegisterForm />
			</Suspense>
		</div>
	);
}

