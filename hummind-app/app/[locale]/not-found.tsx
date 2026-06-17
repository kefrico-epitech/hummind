"use client";

import Link from "next/link";
import { Button } from "../../src/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import { Frown, Home, Mail } from "lucide-react";

export default function NotFound() {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-6">
            {/* Icône animée */}
            <motion.div
                initial={prefersReducedMotion ? {} : { scale: 0.9, rotate: -20, opacity: 0 }}
                animate={prefersReducedMotion ? {} : { scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 15 }}
                className="flex items-center justify-center rounded-full bg-primary/10 p-6"
                aria-hidden
            >
                <Frown className="h-12 w-12 text-primary stroke-[1.6]" />
            </motion.div>

            {/* Titre */}
            <motion.h1
                initial={prefersReducedMotion ? {} : { y: 30, opacity: 0 }}
                animate={prefersReducedMotion ? {} : { y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mt-6 font-display text-5xl font-bold tracking-tight text-center"
            >
                Oups&nbsp;! Page introuvable
            </motion.h1>

            {/* Texte */}
            <motion.p
                initial={prefersReducedMotion ? {} : { y: 20, opacity: 0 }}
                animate={prefersReducedMotion ? {} : { y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mt-4 max-w-md text-center text-muted-foreground"
            >
                La page que vous recherchez a peut-être été déplacée ou n’existe plus.
                Retournez à l’accueil pour continuer votre navigation.
            </motion.p>

            {/* Boutons */}
            <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                animate={prefersReducedMotion ? {} : { opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 flex gap-4 flex-wrap justify-center"
            >
                <Button asChild size="lg" className="bg-primary text-primary-foreground">
                    <Link href="/" aria-label="Retour à l’accueil">
                        <Home className="mr-2 h-4 w-4 stroke-[1.6]" aria-hidden />
                        Retour à l’accueil
                    </Link>
                </Button>

                <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10"
                >
                    <Link href="/contact" aria-label="Contactez-nous">
                        <Mail className="mr-2 h-4 w-4 stroke-[1.6]" aria-hidden />
                        Contactez-nous
                    </Link>
                </Button>
            </motion.div>
        </div>
    );
}
