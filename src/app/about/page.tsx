import { Section } from '@/components/ui/section'

export default function AboutPage() {
  return (
    <Section>
      <h1 className="text-5xl font-semibold tracking-tight">About The Proper Painter</h1>
      <div className="mt-8 max-w-2xl space-y-6">
        <p className="text-base leading-relaxed text-gray-300">
          The Proper Painter is a women-owned and operated interior painting company,
          fully insured and licensed, built on a belief that craft and care go hand in hand.
        </p>
        <p className="text-base leading-relaxed text-gray-300">
          Founded by Elizabeth Best, an architect by training, the business is guided by a
          mission that goes beyond painting walls: fostering and inspiring other women to
          enter the trades, proving that skilled, hands-on work is for anyone willing to do
          it properly.
        </p>
        <p className="pt-4 text-base italic leading-relaxed text-gray-400">
          &ldquo;If it&rsquo;s worth doing, do your best.&rdquo;
        </p>
      </div>
    </Section>
  )
}
