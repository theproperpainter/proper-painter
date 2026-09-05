export interface Review {
  quote: string
  author: string
  source: 'HomeAdvisor' | 'Direct'
}

export const reviews: Review[] = [
  // --- HomeAdvisor (23) ---
  { source: 'HomeAdvisor', author: 'Jane M.', quote: 'Elizabeth and Allie did such a fantastic job painting the interior of my home. They arrived on time everyday (job took 5 days), carefully covered all surfaces, cleaned up daily and respected my home. I would highly recommend The Proper Painter. Thank you again. I will be using your services in the future.' },
  { source: 'HomeAdvisor', author: 'Kim V.', quote: 'Elizabeth and her staff were all excellent to work with! They were very professional, extremely talented and true to their word. Our 28 year old cabinets now look new! I would highly recommend The Proper Painter!' },
  { source: 'HomeAdvisor', author: 'Ray B.', quote: 'Team Proper excellent, meticulous, professional. They go the extra mile. They are cool to work with and easily text or call throughout the process. Definitely hire Liz and TEAM PROPER!' },
  { source: 'HomeAdvisor', author: 'Donna B.', quote: 'Excellent experience! Work was outstanding and Elizabeth was wonderful to work with!' },
  { source: 'HomeAdvisor', author: 'Dan D.', quote: 'Did a great job we are super happy with the painting that was done' },
  { source: 'HomeAdvisor', author: 'Anna L.', quote: "Working with Elizabeth fantastic. We needed 2 rooms painted along with 7 doors. She gave us paint product information and allowed us to make an informed decision. Elizabeth's pricing was fair, her scheduling was accommodating, and her work was just outstanding. Her team was on time and worked so quietly that my husband and I almost forgot they were upstairs painting. We are very happy with her work and her customer service. I would highly recommend!" },
  { source: 'HomeAdvisor', author: 'Shaleea S.', quote: 'Our experience was so wonderful. Expert advice and upfront pricing. The quality of services was just outstanding. Elizabeth and her team made us love our home again. Highly recommend!!' },
  { source: 'HomeAdvisor', author: 'Rich W.', quote: "Very clean, very professional and super easy to work with, fair pricing. She's well educated which was a plus. If I could give her 10 stars I would." },
  { source: 'HomeAdvisor', author: 'Mary G.', quote: 'Elizabeth painted my stair risers and the stair wall. It was covered in wallpaper that was as old as the house. She selected a paint that could cover the paper. She did a fantastic job. She was neat and cleaned everything up before she left. I would definitely hire her again.' },
  { source: 'HomeAdvisor', author: 'MA B.', quote: 'Elizabeth is very professional. When the schedule needed adjusted, communication was clear and reliable. She showed up when she said she would and completed it on time. All tasks were completed as planned and she focused on making sure I was satisfied.' },
  { source: 'HomeAdvisor', author: 'Robyn D.', quote: 'Elizabeth is a good communicator and clearly takes pride in her work. Her finished project is excellent.' },
  { source: 'HomeAdvisor', author: 'Misha G.', quote: 'Elizabeth painted our living room, kitchen, 2.5 baths, 3 bedrooms, and a multi floor foyer. She was easy to communicate with from day one. She checked in with us when our living room paint choice looked too yellow for the room and helped us pick a warm brown that we absolutely love. We will definitely hire her next time we need top-notch painting done.' },
  { source: 'HomeAdvisor', author: 'Michele S.', quote: 'Elizabeth is very professional, friendly and reliable. I am extremely happy with the services she provided. I would not hesitate to refer her to my family and friends. I will definitely use The Proper Painter again!' },
  { source: 'HomeAdvisor', author: 'Tom S.', quote: 'Elizabeth is meticulous in her work. She is always on time & works hard. Her pricing is very fair. I will definitely use Proper Painter again.' },
  { source: 'HomeAdvisor', author: 'Tierney B.', quote: 'Friendly, prompt, clean. Quoting process was clear. Made adjustments to final price based on work needed or not needed. Professional painter who pays attention to detail! Would definitely use again.' },
  { source: 'HomeAdvisor', author: 'Michael A.', quote: 'Great professionalism' },
  { source: 'HomeAdvisor', author: 'Marcie C.', quote: 'Elizabeth was prompt with phone calls and very professional. She explained in detail how the job would be done and she did an outstanding job!' },
  { source: 'HomeAdvisor', author: 'Patricia A.', quote: 'Amazing results. Knowledge, experience. Detailed, exact, science based, meticulous. Care of surroundings, prompt, precise, thorough. Communication, extraordinary personality, one of a kind. My painter forever. Planning next project. Fair pricing. Provides all you need with color help and tools. So happy with results on a room that required lots of details and textures.' },
  { source: 'HomeAdvisor', author: 'JoAnn N.', quote: 'Late season outside paint job, working her schedule around the cold and rain to finish, still a perfectionist! We will definitely want her back in the spring.' },
  { source: 'HomeAdvisor', author: 'Sandi G.', quote: 'Fantastic job' },
  { source: 'HomeAdvisor', author: 'Abigail B.', quote: 'Accurate estimate of time and cost; quality work and attention to detail; appropriate balance of guidance/assistance/information in decision making part of paint choices and details in room' },
  { source: 'HomeAdvisor', author: 'Carol S.', quote: 'Excellent! Capable. Reliable, and competent.' },
  { source: 'HomeAdvisor', author: 'London C.', quote: 'Excellent work. Prompt and professional and efficient. I will definitely hire again and again.' },

  // --- Direct (4, found on the live site's own reviews page, not on HomeAdvisor) ---
  { source: 'Direct', author: 'Denise', quote: "Thank you again for transforming my office into a gorgeous and inspirational space! I am so happy with it! I appreciate all of your and May's hard work, commitment to quality and customer happiness." },
  { source: 'Direct', author: 'Samantha S.', quote: 'Elizabeth & May were extremely professional, organized & so meticulous, especially at the end, making sure everything was perfect! Tons of communication throughout the process and very reliable! They made our cabinets look brand new!' },
  { source: 'Direct', author: 'Mary Pat L.', quote: 'Wow! The proper painter did an AMAZING job with my challenging home from 1903. Worked through all the details! Showed up on time and left the site as clean as when they walked in! So happy and will use them for my next paint/wallpaper job.' },
  { source: 'Direct', author: 'Robyn F.', quote: 'Elizabeth and her crew completed the job at my home within the scheduled time provided. They were thorough in repairing areas of my walls and ceilings that needed it and impeccable in their clean up after the job was completed. I was totally satisfied with their work.' },
]
