-- Wave 2: visual enrichment using broader matching (name+city, club, partial-name)
UPDATE public.stadiums AS s
SET hero_image_url = v.url,
    background_image_url = COALESCE(s.background_image_url, v.url),
    image_url = COALESCE(s.image_url, v.url)
FROM (VALUES
('stade-de-la-beaujoire','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/2ac338979b2417d4f5c11642e3d5de07fcc28de16452fce2eedcf4ad6499777a.png'),
('king-abdullah-sports-city','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/b094922ca20d4d8e0ccd29dc760d26506816c1ab87c23fb2204ac8836b12412b.png'),
('tupras-stadium','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/548e05bd5b646802ef5f7f23d0842128e642718b7fd7a114951e356d73c1ede0.png'),
('merkur-arena','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/5ae851c7bb203b0cb797c837cfce9b128f93c49a16c0707b65ea02173964135d.png'),
('parken-stadium','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/4563eda35ebb2a7a9ad38fc78c433c7ce55fa66c05d2caaaa6946f8fe4f3eca3.png'),
('home-park','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/e64eb9c6c881f954dacd644552356ad6a0038039f8413066b339eda2d2281c2b.png'),
('olympiastadion-berlin','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/d0d509973da36be7709a23136060a54d51ce3ea3f99f8f3e739cc8a744305ee8.png'),
('stade-de-roudourou','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/b7a8a1bad0c98c4f7389f57cafbb8f8b09c0c70d9f8f608daab0f4ef4a56788e.png'),
('stade-francois-coty','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/e878677145b064dbae1bbab7d6f485700c61a818da108cdec39fd51564b5c39a.png'),
('stade-credit-agricole-de-la-licorne','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/70f0ff4fa816c61457bc1576bcec3f6d00a36d221fe6fcb3c6a942d1fca40d65.png'),
('het-kuipje','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/90f5fdb377c3d016fa399caed8430598fa2a0b2f3ffa4a41298af06c078f1899.png'),
('estadio-do-marítimo','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/1dbb2ee91e9cec2ae9f293c92ef8a3ff8e10309885e4d3bb2cd5e895c70652b5.png'),
('estadio-jose-alvalade-2','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/694645e5945279aebfcebb98ca13514abdc83ddfafd46ee9fdf08163275228ad.png'),
('estadio-municipal-de-portimao','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/35e219442bdc39aafd20d45442ce00cfe423b0223ba76d6605d9f5794ee7759d.png'),
('estadio-tondela','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/097a4d009f2bfe80adb76fce63d29cc68b3510e576abb2b456170a6028575660.png'),
('mac3park-stadion','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/714e0c7794324e53b4d2b90d25000ff5a6ed13f569317f2dd26e94072d8c821e.png'),
('cars-jeans-stadion','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/6b11a2c679ad6529edf3e9fa536cddef248ced2ab9e0db9209e9cae381cce62d.png'),
('seacon-stadion','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/9d3934e6781ab2e4ca39ed0cf0be90a1df87e2d3e8f0b7e7146edecef546c2bc.png'),
('de-koel','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/9d3934e6781ab2e4ca39ed0cf0be90a1df87e2d3e8f0b7e7146edecef546c2bc.png'),
('almere-yanmar','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/894a0b6a13d2a167a23800716c361f99d7efedecc2086622cd0c83fc75e6f7e8.png'),
('stadion-galgenwaard','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/4386e829f79cb493874eb713688cadc633fbc319ff784dafc8f27123e9981d8a.png'),
('stadion-de-kuip-spart','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/3785c80ccf9303bc206a2e5c7c1843ce3822433845dd6849942529db30ec6d34.png'),
('cambuur-stadion','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/66430eb9e29a66c9d357f3955e197f7346c591f4c05992e43ab154640be9e64f.png'),
('chase-field','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/2711dfbba392b828e4bc30aba0593901beb196b9f31e75f3738fc18c032d7bdf.png'),
('childrens-mercy-park','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/16c3a5daba5b41e488871b9b33775cca9ecfd58da5458ce6dc25aa0b03bd24fa.png'),
('exploria-stadium','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/ee5bfda991340742a08e53d9a821c69df807bd032ed7d48abdb726866e0842ed.png'),
('dicks-sporting-goods-park','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/23424043d23d2076e2d2f450838ffb2b9beb1309c7ecb8d29d54883862899c51.png'),
('ullevaal','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/6dc221543b4e9ba9cf80143db98e1169c9fd9c104890d2e5b355e5b29cfb79ab.png'),
('lerkendal-stadion-rosenborg','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/33cce3d9ef8953bbfb471f86fbb2f886f0c9f1690e7aff73dcc35daad7821d91.png'),
('stadion-narodowy','https://static.prod-images.emergentagent.com/jobs/5de0c32a-6906-4f7a-b536-900620bb7394/images/d85ee6c937954cab70c4974bf7a2c75aec6d457af022383807fc75246ccccbb4.png')
) AS v(slug, url)
WHERE s.slug = v.slug
  AND (s.hero_image_url IS NULL OR s.hero_image_url = '');
