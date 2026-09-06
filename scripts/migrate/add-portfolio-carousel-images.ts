import { sanityWriteClient } from './sanity-write-client'
import { uploadAsset } from './upload-assets'

// One-off script: migrates the ~120 real project photos discovered in the
// live site's /portfolio page image-carousel blocks. These were missed by
// the original crawl (crawl-assets.ts queries static <img> tags; these
// carousels lazy-mount each slide's real <img src> only for the current
// index, so the crawler saw base64 placeholder GIFs and captured almost
// nothing from this page).
//
// The URLs below were extracted directly from the live site's embedded
// __NEXT_DATA__ JSON (props.pageProps.page.blocks[N].pictures[].media.url)
// rather than by clicking through each carousel — the carousel component
// only mounts a window of slides around the current index, but the full
// image list for every block is present in the page's own server-rendered
// data regardless of what's currently visible.
//
// Category assignment: the live page has 13 image-carousel blocks; 7 carry
// a visible heading (Interior Painting, Cabinet Painting, Faux Finishes,
// Wallpaper, Furniture, Color Consultation & Design, Minor Restoration) and
// 6 have an empty headline and sit immediately after one of those headed
// blocks. Each unlabeled block is attributed to the nearest preceding
// labeled category.
//
// Safe to re-run: skips any filename already present as an existing
// afterImage/beforeImage asset in Sanity (checked at runtime, not just
// against the hardcoded EXISTING_FILENAMES list below).

const CATEGORY_URLS: Record<string, string[]> = {
  'Interior Painting': [
    'https://cdn.durable.co/blocks/1044yBUJaHVeBfUkCz6livc6eWPeToliBfO5YGgNeGBYuAfZL6SpZQqFOQU2bpm7.png',
    'https://cdn.durable.co/blocks/6enqV4xlLF4hyp3fOKXfZlcw9RdzhlNeg0cnsI5Lj4sgFELVlU6o7bshRP5aDl2T.png',
    'https://cdn.durable.co/blocks/153MHIryGao1adi5XZ2VFYNefpeyKgeuUiIQ3d63CFVQhVKiPj9ADeAdTxc26DdO.png',
    'https://cdn.durable.co/blocks/1aNs41tVgI6NxTL5rapFoa4aeJVywNUe12lxwhx1PPGRVu4746hZVPzJ93j2kXjH.png',
    'https://cdn.durable.co/blocks/32KhcIqPpjcHRG8hmONH7afFabU8FvCMDCepWhqVAmS9Yc7nCBn3LYeOJ60SwmR0.png',
    'https://cdn.durable.co/blocks/3a7PCUUc27v44j7z7ZoVTEErVhQ4Q9S4EEhvHXu2dmdmbStPP6UGVeuuRuoAlQ9n.png',
    'https://cdn.durable.co/blocks/7d9BADBk3W56K2LN7DAeLsm7k0dCuh5cwIlunzJYxbGH4SwPt9xhU22I5nBQ5Gwp.png',
    'https://cdn.durable.co/blocks/34Z73Dt5LXPWmJH3nDC2BV5HJIeXvUIBFmGgvetS7QoEjy6PH77wr31Jqh4GDszU.png',
    'https://cdn.durable.co/blocks/dArkwyIYfQmZfWTMyVaBaScAJTXBTYZlHn8Qgp8NS3pk67iQvOEgtGD2I4cD1vuj.png',
    'https://cdn.durable.co/blocks/71rJV9ge7Y4xx9rqozgfQeHdSbmH1rxuwuLULMsJkVXOPWGSqoulJ1fPJSzGpXCS.jpg',
    'https://cdn.durable.co/blocks/36qkUdMJygZvtzxbLkh5z6DZHNwsdpa8Cm7z9q6YX4e6iPg7MXLwr9VjmgYH8QQM.jpg',
    'https://cdn.durable.co/blocks/263M9cerb0wtZq4EdqopOtqdpb1fSISIBNTiPPLJ03l2f8o6d7exKw688YwHOFMN.png',
    'https://cdn.durable.co/blocks/8ZFCtzQLrMNUyCyxKcJ99x9mWRK9e9Q5thaLN1K4a2UTpOP910D75bbJr1ZciaMX.png',
    'https://cdn.durable.co/blocks/2bLwNuhpSMW5La5DoIdRPct1ZEo5XEGfgS7yVryTlDfHLWwtgBiXbPd6ehW9H1cx.png',
    'https://cdn.durable.co/blocks/2aTgj4NRKPsRWPsYQqvMTRN0LeTCEucPZhvuJVLn4GDohD8QUG7D8VRwuHBKw6e0.png',
    'https://cdn.durable.co/blocks/2fJhhbAJPopIbUjjUHvbRyXJGuBavUWLMHth23U0kWzy7yiEyR69wY9Of8MUupDh.png',
    'https://cdn.durable.co/blocks/212PyPL06kx8OWYpH1dyxX61rvk9GALYwnXSVRMSytPFzOL3TrWHsgAdlYteRvLA.png',
    'https://cdn.durable.co/blocks/1sTYdN6RDcU0WpP3o7f6YP0TmAutAwc2FDzfMqZ0gquThKWOoPZwhf48dbyobSJJ.png',
  ],
  'Cabinet Painting': [
    'https://cdn.durable.co/blocks/7SchFNdgydgTfhyuUOxJqWM2nz28pDgKQKVNpSZOOU6g2feGCNA4GwU6MrEv9Wf0.jpg',
    'https://cdn.durable.co/blocks/2dNiYU5owqbXkOy3xcyv478AFExAfFooZ70MOYG32Y0Szkzv3DnJaYjfZzvfJwbZ.jpg',
    'https://cdn.durable.co/blocks/2f4mj9iBbSpRGdYfeE4SiUOp8pCZXypdJw13VY7YRaXCMtJn0OOJWTMomSJUzhUw.png',
    'https://cdn.durable.co/blocks/2auzIoYp8svQHmzVSE3oQtxvlgPLaQW11YmVTau3b38hpGlTfxSindGds3c6VDsf.jpg',
    'https://cdn.durable.co/blocks/13aIla348XiP6y7201rmh778kQ714tR2ZIbN1KPsSepI8w0V3Ekl6l5fHB3wHzNK.jpg',
    'https://cdn.durable.co/blocks/12TYQC4UrQVTIT4bujMu5gYrpVpVR4f9flZHZwCrrN4VMBE7tcHO851az41Kld4I.jpg',
    'https://cdn.durable.co/blocks/2enWSNAIYkqMd6uXB4GYswdB53J6VOHUJTTQkfWtw57295GqpyRaPMRV0c8V0LX2.jpg',
    'https://cdn.durable.co/blocks/399ak6GceMORbpQOY8xV8770wYcjyBjbBZrC2Qx1tJ1e6hEEfrvpHBD7zROZQYuz.jpg',
    'https://cdn.durable.co/blocks/2cmW5R2fLWclVUj78KPs2l6Pwoxp5g15ccb2Ri4fXpV0dCS3lWaGEQ1O4OXwQg8S.jpg',
    'https://cdn.durable.co/blocks/2aCcZsndgbkpCEw28alSJBmnhAjWlJcnID79VxYsccFjho8oEE71xGvPzIRCyrrF.jpg',
    'https://cdn.durable.co/blocks/1495zfZzt5PmCvNGbI7bbiJRg9CsuzkYmDqaXesy45tVAAbnvV7rpxYe5LPMyihw.png',
    'https://cdn.durable.co/blocks/388q1ol5CsBAVGriTbFaPHkr3IeOiTCkHYDkEs8PxVtlhYJL8jRaIp1kQ04Wbprk.png',
    'https://cdn.durable.co/blocks/3bdOj1g027KSeCXu2E591AqrjEa3vshNlfcDZvOozB5JCm5oErfHX80hVIWOjoj9.png',
    'https://cdn.durable.co/blocks/153MHIryGao1adi5XZ2VFYNefpeyKgeuUiIQ3d63CFVQhVKiPj9ADeAdTxc26DdO.png',
    'https://cdn.durable.co/blocks/21wqB1HwTesr0VnCOrIjF9H3xU12ETHoljLdlQkztWCxesMxu5JVxSdb5bI4w3SS.png',
    'https://cdn.durable.co/blocks/35VKuXIsXUNTRbg01POrDz7ihoD2pfjOkSqQNacnoh98TVJuAOszowPYoMHUsQqq.png',
    'https://cdn.durable.co/blocks/17yXHG1xP1lsqrMkY6Qjrb4iU5dqkc5DYeIEOQVMbCzYs5fR4SO6rQuDBFLveaTC.png',
    'https://cdn.durable.co/blocks/34PHXANAUIHPvqRE2QFJrld5ojyes7R2cneBqXuu1IvUiobkqxIMgkE9tz3okqjC.png',
    'https://cdn.durable.co/blocks/17KA9WuHsXU49xBmmqBk8Ua3IiKyiEQGxNYRQdd7oI680xCmOe5sbcn8fkCcqQxj.png',
  ],
  'Faux Finishes': [
    'https://cdn.durable.co/blocks/2cVLSqatACNw7FSKGdsccD9jAzHLAWukMEjzNjX3YYijJywaXxIZ4pr3Hr24cY0t.png',
    'https://cdn.durable.co/blocks/eCIix9lEtgBPPzRbwzux69IEjjtlj5b4lHnYjWoKWIlIUQ6NYOKCTp4A3z9tqyXh.png',
    'https://cdn.durable.co/blocks/2chAM3MAaZw4Su6juo6NVaA4AkrOuyzlFJmzGvntc0eAxJ5pzne2OjkSp9MY4cQc.png',
    'https://cdn.durable.co/blocks/aVJFky8kZmqEXonuNbsqz9FszOrkCbCalhTKFvRjIKENpQDed1835fe67eCmzGlu.png',
    'https://cdn.durable.co/blocks/22g34gbf0pzZg51XppO5scgvTKxtpIHURa1RYBRJ3QjkmMHHh87ydfrsaph6NKB1.png',
    'https://cdn.durable.co/blocks/7yXZKna1S4VsWd8AAzPO8KE17jmfyBHvY0qsZ0kyq50A7w5znMQjFN36YPvLkKzK.png',
    'https://cdn.durable.co/blocks/2bqyXDcS7KlBuP2kvpb0kJIR9bHYm8MMqDAi0slQw04aX0kDio9uFEtA7JegXMRy.png',
    'https://cdn.durable.co/blocks/fi7roel18WLDORAnd1tY6ulWx8FfjELTRYTjzY5WqLu5uspfJq5WDALCTY9RBpg7.png',
    'https://cdn.durable.co/blocks/28Jq75UUfdoh2flrWgikDUTpDzsHFfMpDL2x2EJucHd5N9oKgyd25HvvGevExwbb.png',
    'https://cdn.durable.co/blocks/aUeshPeVCReRAUggRo6F3FiCti6QsfP6U1sWGzj7dPrlNgeGNaCBxsvzgvOB2olb.png',
    'https://cdn.durable.co/blocks/27kLYTBpzyM4nTpbnbVdroxhVyO5EzBNIcL0Nb8TW2aOlm7NWQGrZ2jtRMGNzfC9.png',
    'https://cdn.durable.co/blocks/bnB9OROO92u9KN0vE7t6l8Lm5N34RfHqK2xVQNrT6cc2otLYsvcT6bo5OwhOAkQP.png',
    'https://cdn.durable.co/blocks/9VDWZqjuhSUco9f244DJXAbNr5FLCU41ggUtFstpL0xrHQBRvURQBlXMnIY50npa.png',
    'https://cdn.durable.co/blocks/12A7zN47Gg71DHfckrPYaglHXCxx8DN6sltchb4wn3RmwCDo1ov8QrYFtJN3b5se.png',
    'https://cdn.durable.co/blocks/2978oTDqfLheDx7gQp4uYCG8t4h2xZr1zQRAeAhqp2xHuwQAnUqbcODC8u3fq6S9.png',
    'https://cdn.durable.co/blocks/17CheRyzhEMGjCn2MbQtdH2OuimtcjXJsGvcwLByIlQkjyXNiETdkQvL3zsdNZKW.png',
    'https://cdn.durable.co/blocks/10mQrhf6UeBERppbqG7OcQSZHCbh33YBzip8kBOizQz79Jgm1RnX561Mb3xDYD7r.png',
    'https://cdn.durable.co/blocks/1f3qBMcQYemJfPob202ahX5DBYyEFHA4Wi125zNcHoCVPHidl1HQLYFU1Fq2wFbX.png',
    'https://cdn.durable.co/blocks/29yvYZZhSNfgXeDIcZ8Khsj3hgXPQv0Lsdh3xta10LNNJp0BLtI0VNgg1AmJwWPp.png',
    'https://cdn.durable.co/blocks/32yVNCB11cDQEZ1KmJKxhvdMFkgmAuNo1splRJuRbemo49BMNpkM1gRgqgC128yL.png',
    'https://cdn.durable.co/blocks/0TFKpP9RsUSGfAeOsw5V71R7IK1QhgErAPuYZ8uYGIG3wrvWPiM7QpWAtnlXLygo.png',
    'https://cdn.durable.co/blocks/10EcgB82tR29bPvj241kD80NNHZoAI9phj1XP8z62NC8lKee6vmD16TkM04oZtuj.png',
    'https://cdn.durable.co/blocks/1aAycAMtncN0bEpE8fcKtzAba2et7vlw73UEmglrjaYyJceigbaH7N2sLsFMmNKG.png',
    'https://cdn.durable.co/blocks/236AFVHoTlUAoGVefQPoE5Vtx4wdLfxRcgd6mZWgZW3aqitzqeFYBerz08Q0AwOr.png',
    'https://cdn.durable.co/blocks/1bEpkvDmRDTDbf1yK1F6lgmicLHAzJGsZd6gsIQDeNmvQT78ak6dtwYoNjZckwd9.png',
    'https://cdn.durable.co/blocks/6SXBOZRbnFSU5jzwCqCsCFFNfqAH9uwTt2hRLKagTvKm7aU75WowFumR5xvLsU9t.png',
    'https://cdn.durable.co/blocks/5YsL2cNK3qaWMz6BOb3Xl88UDnaYTMu0cNHCOamboDAx6UwYDJ7vRVLQL2Xkzo8r.png',
  ],
  'Wallpaper': [
    'https://cdn.durable.co/blocks/37LgLn19n4PqR4u5ywgz0MO00o8Gomyicu6jkchoMX5tOmyE6Qd07WA61eEyK5z5.png',
    'https://cdn.durable.co/blocks/bHKFG1lmw8Y3laPTS9gAtD3gSfWq5yPeq6f2Mp1JLbeC9k5an0bZ8jiRzphtnM4T.png',
    'https://cdn.durable.co/blocks/256eKReqHh0sNJf3FkbKSGicwLjYQMotrrudysgXslw87Wlynl6mgOzUUZvvmDqq.jpg',
    'https://cdn.durable.co/blocks/cZdnvNtIdWAw6wluZd8aVqAMAXssQkvb6jXbkkJztx3hkKyNHPBzLV0SbTH5JEv6.jpg',
    'https://cdn.durable.co/blocks/2d7QwVyKVVxsjVyIypeIcB07GBXtS0bk6AVa1i8Pb0Mdio8cN6IqLQ0JUWVIA30o.jpg',
    'https://cdn.durable.co/blocks/bUuiHdPILsiMpRgGOx22TSvIllIzctNdEua9VkXDZ35Waz9eS2M21V1nIK26gc0a.jpg',
    'https://cdn.durable.co/blocks/2aHlcWmN1b8yiPsf468jAFTlMRyqtGaSdE5FK0b3sixhhAl49PYCdPSxl3VbUC4c.jpg',
    'https://cdn.durable.co/blocks/215xWcZEe7EQ6GvZb3761xNV1dzBcdZtrTsjhMpZgR0bnZQijnp5i9zhNVdcIBB1.jpg',
    'https://cdn.durable.co/blocks/1410DoD8UyG5ig9c3wGrn1mjBvQ7bCfKVH8mYBjPKgufc8e7D67i0GR30mQTNuhL.png',
    'https://cdn.durable.co/blocks/3qdJJgkNlstNNo5N3d8tm3doQ7V8eXptXtEUw1zkgDNxFEn40k7qelIqY8sxBxnk.jpg',
    'https://cdn.durable.co/blocks/27AiOqPNYxPqI89fYKSe2iupyfbI9Wmeej39nE7aU6Vtyy0ImAxvmo93BDPL38g3.jpg',
    'https://cdn.durable.co/blocks/1aYfI4P7b5b6YZwW8BtZCv4Fzn4qfJbLGpVOIxhYnXu6kYzq2tYwDeU91BNxzbj0.jpg',
    'https://cdn.durable.co/blocks/10jFnJfYdPITmRbqAD314vfwECwCg69MvFz9EcvJfziaojb4SyZY0Igiqau043I7.png',
    'https://cdn.durable.co/blocks/6bOOHonU5ltHioqERmtMLJrVCbXRcOCoyrPx4lnzJgB3I9FnT4DnCSE4CRwsstYd.jpg',
    'https://cdn.durable.co/blocks/12Ho03KH3F7DalLUYzWeYX3AH7HuqLHVxBK5JNJYmmDK7J9WXH05Nm9UssgfAnH9.jpg',
    'https://cdn.durable.co/blocks/29PpP3Wx66qUM46AS36OB6WOs0FezUCLtP3I3bvEynAdpGcw8SLPZXfAsPE1yaZr.jpg',
    'https://cdn.durable.co/blocks/fuNs7JBwQycFXwAUJPCbvsan9tb0g3sPVXZvMaA2xgUdI3aqOdY8LprlGgIBb3GY.jpg',
    'https://cdn.durable.co/blocks/2cEqfxw4btbp8qp0qcf1hboXMSstcWGj9Cteo7OiQWeJBD9zowViQzw0K8jA0bbc.jpg',
    'https://cdn.durable.co/blocks/avOIqxLJVnkI2oM3ZEJv3xLDBRV9sNlm8UdxYNbbSqjAiZBNWuxEBXE43tAFlFaQ.jpg',
  ],
  'Furniture': [
    'https://cdn.durable.co/blocks/15vnErEfDa67EIt8XMM8Nx7uOu4RYFB0eoQppELZW9TQ5pVHbpFOJKcHKA4GEr19.png',
    'https://cdn.durable.co/blocks/3wX0vCEJnNGM6gr7AaBQflOweITb03c4PCJISUiROvZoBlnDLABD9OmPsWh8JZBu.png',
    'https://cdn.durable.co/blocks/21z4XJFHw1qSUBG7kxAmQf80rW4lYKvWnJ72lrZpljFpKbS3MNnuLTtOPNsDIT3X.png',
    'https://cdn.durable.co/blocks/17MBx73JDEy61cLTLv4T3XzFzy216HkuO98SBijbrlftfyIQdb9NluGUNq95rdgh.png',
    'https://cdn.durable.co/blocks/2d4okagmAUM6ZaYAKnLJVBqB40sJlmt9nsEgKf0z1928rY1v6wrSZj1rdAyxJito.png',
    'https://cdn.durable.co/blocks/1cs4dgenmWqSyl0E3NRaIt4n73dL0m6ITbg9AtjXDnGbcIlnrVE3lgTp5JcEMa9u.png',
  ],
  'Color Consultation & Design': [
    'https://cdn.durable.co/blocks/7WlO0pUn2a4fgTp5DTjO5Ai2gYlISjfyFFpYr91m6bRmIj8FegYU8Op8AcSmxrLR.png',
    'https://cdn.durable.co/blocks/96cMwKjWMLI97u0nfNo8C9zawzwwvQZEpre0AmErjSUTONreuM59cEUJrTNOIiyG.png',
    'https://cdn.durable.co/blocks/0oZjAx9F60CHrFvqXCg6vEwpanrzTOrmTYG0pc5dFuWRgeOF2xLHpeNPBtqanuWI.png',
    'https://cdn.durable.co/blocks/ec7aLHHQNTZuKhaucGE2uhwYHqU4IS0azRav8JX4smCvn5bhkneEhoJlCLyg6N5y.jpg',
    'https://cdn.durable.co/blocks/28Jf4QbdenKVA34Q53073lqdzGNsjtOMS0fSA2UPIFDAGLmDgupaAQTgStpZ0Nv5.png',
    'https://cdn.durable.co/blocks/ezAtVIz2QXNOq3DLPGBKbqxd7Qnr6Jh6OIKPyC8ohQNlNWxmQyfp3U2muprcRRvM.jpg',
    'https://cdn.durable.co/blocks/87VOxNbfJwVU5IN8hF3kQtljuunrQ3waOJaXq9e2veoW9bhEaJHsrq3Ijos9ZONr.png',
    'https://cdn.durable.co/blocks/17UOKanGAj4XZCkPbWbMZPeHvr6m8UPuj82rymhmZXC3owZosdhFfY0wZQH9DFdn.jpg',
    'https://cdn.durable.co/blocks/2082fzUOHV2g8s7akn7zACXkza16ARd5VlRr5IhKCWRDQVLh9w2Pd6m8ZNWlM9ne.png',
    'https://cdn.durable.co/blocks/17ojbZSiZzstHyERKYHRRIh2dq1pJ1ic15rjRf0UDmzw4IZwCYfeUDiIbmMawrWc.png',
    'https://cdn.durable.co/blocks/250MSMqpLlIDDZkrC30U2JMT5M2zysOwlFnyst6SwH86GGnBoOjDZoy6R5L9ICha.png',
    'https://cdn.durable.co/blocks/7sumnTcvjiQLb0Oebtb2Dv5SU3r2QgRNnbvkz8TsVqpMuZgilYxUW7AsVdOjataU.png',
    'https://cdn.durable.co/blocks/14xZhONIt5Iii8Le0CWtkZ0NJz1IMpgFeX48MsgGuckKVpKutRHzwDYDYISIBCNz.png',
    'https://cdn.durable.co/blocks/300wejPZcwl0USQ096TgWH1lw8OKY0hSju4zMMuKNaEioOqthZcZHr3pIaL8XbhJ.png',
    'https://cdn.durable.co/blocks/27xFXMlQiz9LOIp5LQU0wg3wE0eZvrPVesCW10J1YMFrX82wGQTFLM5KnsFIxHmo.png',
  ],
  'Minor Restoration': [
    'https://cdn.durable.co/blocks/24tcPf0p5IL1GXaOxxnB90H0oo3otkHEGO1GhK6fXo7C4aurdO3pMkiNzUW90qDd.png',
    'https://cdn.durable.co/blocks/16zjD2LDLoLplzGQrLZKCZbB1OggN5Ym5gYV7IqsKJPrOVG7KUsTQyhSAYniwImv.png',
    'https://cdn.durable.co/blocks/1EFQJjpox3JAdgzU2V2otTPwLoH1Zx5O4NMv2rXeE2dFbcC2WD5PwxXLMRW0uL6Q.png',
    'https://cdn.durable.co/blocks/1elIrpUojUu7vHfPLO77kni9Y6GaoXwx4V3qQJ3LX11zwNeR1w53V3OOPfiXhNZ5.png',
    'https://cdn.durable.co/blocks/bCQFn3x8XhXze2iqO257VLpWEL2sFhXhshzG1HqLB5kutThFJsCF4zvjYmpEG7J4.png',
    'https://cdn.durable.co/blocks/25hNQwZrcgqu7BsUI2LfCUOqBhKe8vOXzFPtp4JuxK85xDP9HW9oCWrjvs2z1wT1.png',
    'https://cdn.durable.co/blocks/13stX8DQfd3JWj3KZUPZxtvYoRGzeM1cPWZPuKXjAVggbmBEETZETrrgxciftmYF.png',
    'https://cdn.durable.co/blocks/39erQI2lQ50uxh7d6kylvcIBFDZjsxweTCrY35xj3ct8JNahVFrG4sQWGwuuW0aF.png',
    'https://cdn.durable.co/blocks/22RKdAHAOmCLMmZYt8GfY4qqbmMRpI9iqxEIiO54gQ9TlsK0CZdzGcX3asqxhAco.png',
    'https://cdn.durable.co/blocks/33QEEXQNf1t2YUlmXe29cizF5SHAFmeU2ou2EYKh8BAI52d6P1Jj8uh0l38WN6o3.png',
    'https://cdn.durable.co/blocks/2ixGt8YO6qunvpnYzAie5gzyrAYLzVBSARTWnSIM8uSSR5kP5FaHC7uLWN4XGPUE.png',
    'https://cdn.durable.co/blocks/149OEEelssZmkLpwoLbZPcdrC8IQJicZdeJBwoWKw8Fary7cLtihafYHu9juvBUQ.png',
    'https://cdn.durable.co/blocks/2frkqSzbp4bQjIEiFB85OYY1fs6ojc5ryxroJDsUOGGpbBWVLZXwkDMJD0WBmYQ5.png',
    'https://cdn.durable.co/blocks/frtnogi0vsbNKLYQlmWup9qy8IwtvtvzgtETAPqZgqm0ZL4jF1kBnna146weYPZz.png',
    'https://cdn.durable.co/blocks/8MGnX2PbQvQFq1nN5Y1OLnWVcaoEQg1R6CehujzoioVIVlPLLODnFR4xXECikMv7.png',
    'https://cdn.durable.co/blocks/37AQqd58zmuyLkdKCNgZHDqvfAz1q5HZslIlCx0YsZde9BCPE5dTbJ723oMPhPH4.png',
    'https://cdn.durable.co/blocks/29iUgOipRGEiJd44iT9sxYpXOp9DQG7urSCVAw5FGoJ7zwKIx3Tz2drGe9UyYp6f.png',
  ],
}

function filenameOf(url: string): string {
  return url.split('/').pop()!
}

async function main() {
  const existing = await sanityWriteClient.fetch<{ afterOriginalFilename: string | null; beforeOriginalFilename: string | null }[]>(
    `*[_type == "portfolioProject"]{"afterOriginalFilename": afterImage.asset->originalFilename, "beforeOriginalFilename": beforeImage.asset->originalFilename}`
  )
  const existingFilenames = new Set(
    existing.flatMap((d) => [d.afterOriginalFilename, d.beforeOriginalFilename].filter(Boolean) as string[])
  )
  console.log(`${existingFilenames.size} filenames already in Sanity`)

  const seenFilenames = new Set<string>()
  let created = 0
  let skippedExisting = 0
  let skippedDuplicateInBatch = 0

  for (const [category, urls] of Object.entries(CATEGORY_URLS)) {
    let n = 0
    for (const url of urls) {
      const filename = filenameOf(url)
      if (existingFilenames.has(filename)) {
        skippedExisting++
        continue
      }
      if (seenFilenames.has(filename)) {
        skippedDuplicateInBatch++
        continue
      }
      seenFilenames.add(filename)
      n++

      const afterImage = await uploadAsset(sanityWriteClient, { url, alt: category })
      await sanityWriteClient.create({
        _type: 'portfolioProject',
        title: `${category} — Project ${n}`,
        category,
        afterImage,
      })
      created++
      console.log(`Created: ${category} — Project ${n} (${filename})`)
    }
  }

  console.log(
    `\nDone. Created ${created} new portfolioProject documents. Skipped ${skippedExisting} already in Sanity, ${skippedDuplicateInBatch} duplicate URLs within this batch.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
