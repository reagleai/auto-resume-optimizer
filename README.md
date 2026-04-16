# Auto Resume Optimizer

## The Problem
Every job application requires a tailored resume to stand out to recruiters, but manually editing a document for every single job realistically takes 20 to 30 minutes. This creates a frustrating bottleneck, burning out job seekers and drastically slowing down their search. To solve this, I built the Auto Resume Optimizer: a web application that takes your base resume and a target job description, and automatically generates a perfectly tailored, factually accurate PDF resume in about one minute.

## The Target User
This tool was initially built for myself as an AI Product Manager, but it serves any busy professional who applies to multiple roles and needs high-quality, customized applications at scale. Modern job seekers need a way to align their experience with specific company needs without spending hours obsessively rewriting their past accomplishments.

## The User Journey
You start by setting up a one-time profile with your base resume and basic contact information. 

When you find a new job posting, you simply open the application, paste in the raw job description, and add any specific keywords you want to make sure are included.

You click generate, and the app takes over. Instead of leaving you waiting in the dark, the screen updates to show you exactly what the system is doing behind the scenes. 

About a minute later, your custom-tailored PDF resume naturally appears on screen. The app then securely saves this new artifact to your personal history dashboard so you can review, download, or reuse it at any time.

## Impact
- **Time Saved:** Reduces a tedious 20-to-30 minute manual editing process down to a single automated run.
- **Speed to Output:** Takes approximately 1 minute from pasting the job description to downloading the polished PDF.
- **Safe Editing:** Independently rewrites 4 distinct sections (Summary, Experience, Projects, Skills) while strictly locking down factual data like titles, tenures, and company names.
- **System Efficiency:** Executes 4 targeted AI decisions across a highly reliable 9-stage automation pipeline.

## How It Works 
I designed this architecture by cleanly separating the user interface from the heavy AI processing. Every technical choice was made to prioritize reliability, speed, and document safety.

**The User Interface**

The website itself is built to be fast, responsive, and incredibly simple to use. It manages your profile, displays your past resumes, and handles the loading screens while you wait. I used modern web frameworks so it feels like a premium, polished consumer product rather than a clunky internal script.

**Data Storage**

To remember your history, I integrated a secure cloud database. It safely stores your profile and keeps an organized historical record of every resume you generate—including the actual PDF files—so you never lose a past application.

**The Automation Pipeline**

This is where the real work happens. When you click generate, the website sends your information to a 9-stage external automation pipeline. Processing this separately means the website stays lightning fast and doesn't unexpectedly freeze while the AI is thinking. 

**Smart AI Processing**

Inside that pipeline, we carefully take your resume apart. Rather than asking an AI to rewrite the entire document blindly—which often ruins formatting or invents false facts—the pipeline isolates exactly what needs changing. The system extracts intelligence from the job description, plans a narrative, maps out keywords, and finally refines the text using 4 distinct AI steps. Because the AI steps only return text, we save all your original formatting separately and safely reconnect the new text back into your layout before converting it to a final PDF.

