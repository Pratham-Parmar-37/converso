import Image from "next/image";
import Link from "next/link";

const Cta = () => {
    return (
        <section className="cta-section">
            <div className="cta-badge">Start learning your way.</div>
            <h2 className="cta-title">
                Build and Personalize Learning Companion
            </h2>
            <p className="cta-copy">Pick a name, subject, voice, & personality — and start learning through voice conversations that feel natural and fun.</p>
            <Image src="images/cta.svg" alt="cta" width={362} height={232} className="cta-illustration" />
            <Link href="/companions/new" className="btn-primary cta-button">
                <Image src="/icons/plus.svg" alt="plus" width={12} height={12}/>
                <p>Build a New Companion</p>
            </Link>
        </section>
    )
}
export default Cta
