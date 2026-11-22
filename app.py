import os
from flask import Flask, render_template, jsonify, request
app=Flask(__name__)
app.config["SECRET_KEY"]=os.environ.get("SECRET_KEY","medilearn-dev-key")
LESSONS=[
{"id":"skull","category":"Anatomy","title":"Bones of the Skull","level":"Beginner","duration":"12 min","summary":"Explore the major bones of the cranium and facial skeleton.","objectives":["Distinguish cranial and facial bones","Identify major skull landmarks","Explain the role of sutures"],"content":[("Overview","The skull is the bony framework of the head. It protects the brain and supports the structures of the face."),("Cranial bones","The cranial skeleton includes the frontal, occipital, sphenoid, ethmoid, two parietal, and two temporal bones."),("Facial bones","The facial skeleton includes fourteen bones, including the maxillae, mandible, and zygomatic bones."),("Dental relevance","The maxilla and mandible support the upper and lower teeth.") ]},
{"id":"oral","category":"Oral Anatomy","title":"The Oral Cavity","level":"Beginner","duration":"10 min","summary":"Learn the boundaries and main structures of the oral cavity.","objectives":["Describe the oral vestibule","Locate the hard and soft palate","Recognize the tongue and floor of the mouth"],"content":[("Overview","The oral cavity is the entrance to the digestive system and contributes to speech, taste, chewing, and swallowing."),("Divisions","It includes the oral vestibule, between lips or cheeks and teeth, and the oral cavity proper, inside the dental arches."),("Palate","The hard palate forms the anterior roof of the mouth. The soft palate forms the posterior part."),("Dental relevance","Oral cavity anatomy supports clinical examination and the study of local anesthesia.") ]},
{"id":"tooth","category":"Dental Anatomy","title":"Tooth Structure & Morphology","level":"Beginner","duration":"15 min","summary":"Understand the main tissues and external regions of a tooth.","objectives":["Name crown, neck, and root","Compare enamel, dentin, cementum, and pulp","Explain basic tooth functions"],"content":[("External regions","A tooth is described in three general regions: crown, neck, and root."),("Enamel and dentin","Enamel covers the anatomical crown. Dentin forms most of the tooth structure."),("Cementum and pulp","Cementum covers the root. The pulp contains connective tissue, blood vessels, and nerves."),("Dental relevance","Tooth tissues are foundational to restorative dentistry and endodontics.") ]},
{"id":"periodontium","category":"Oral Histology","title":"The Periodontium","level":"Intermediate","duration":"14 min","summary":"Study the supporting tissues around the teeth.","objectives":["List periodontium components","Describe periodontal ligament functions","Relate gingiva to tooth support"],"content":[("Components","The periodontium consists of gingiva, periodontal ligament, cementum, and alveolar bone."),("Periodontal ligament","It is specialized connective tissue between cementum and alveolar bone."),("Functions","It supports the tooth, distributes functional forces, and provides sensory information."),("Dental relevance","Periodontal anatomy helps explain tooth support and periodontal health.") ]},
{"id":"histology","category":"Histology","title":"Introduction to Oral Histology","level":"Beginner","duration":"11 min","summary":"Connect basic tissue types with structures in the oral region.","objectives":["Identify four basic tissue types","Recognize epithelium and connective tissue","Understand histological sections"],"content":[("Four basic tissues","The four basic tissue types are epithelial, connective, muscle, and nervous tissue."),("Epithelium","Epithelial tissue covers surfaces, lines cavities, and forms glands."),("Connective tissue","Connective tissue supports, binds, and protects other tissues through its extracellular matrix."),("Dental relevance","Oral histology explains the microscopic organization of gingiva, oral mucosa, and salivary glands.") ]},
{"id":"trigeminal","category":"Neuroanatomy","title":"Trigeminal Nerve: Dental Foundations","level":"Intermediate","duration":"16 min","summary":"Review the major divisions and dental significance of cranial nerve V.","objectives":["Name the three divisions of CN V","Distinguish sensory and motor roles","Explain dental relevance"],"content":[("Overview","The trigeminal nerve, cranial nerve V, is the major sensory nerve of the face and also supplies muscles of mastication."),("Three divisions","Its divisions are ophthalmic (V1), maxillary (V2), and mandibular (V3)."),("Dental relevance","The maxillary and mandibular divisions carry sensory information from upper and lower teeth."),("Clinical foundation","This anatomy supports learning about dental pain pathways and local anesthesia. Clinical procedures require supervised professional training.") ]}
]
QUIZ=[("Which bone forms the lower jaw?",["Maxilla","Mandible","Zygomatic","Temporal"],1,"The mandible forms the lower jaw."),("Which tissue covers the anatomical crown?",["Cementum","Pulp","Enamel","Dentin"],2,"Enamel covers the anatomical crown."),("Which is part of the periodontium?",["Periodontal ligament","Hard palate","Tongue","Masseter"],0,"The periodontal ligament is a component of the periodontium."),("How many major divisions does CN V have?",["Two","Three","Four","Five"],1,"The trigeminal nerve has three major divisions."),("Which tissue lines body cavities?",["Muscle","Nervous","Connective","Epithelial"],3,"Epithelial tissue covers surfaces and lines cavities.")]
@app.route("/")
def home(): return render_template("index.html",lessons=LESSONS)
@app.route("/api/lesson/<lesson_id>")
def lesson(lesson_id):
 x=next((v for v in LESSONS if v["id"]==lesson_id),None)
 return (jsonify(x),200) if x else (jsonify({"error":"Lesson not found"}),404)
@app.route("/api/quiz")
def quiz(): return jsonify([{"q":q[0],"options":q[1]} for q in QUIZ])
@app.route("/api/quiz/submit",methods=["POST"])
def submit():
 answers=(request.get_json(silent=True) or {}).get("answers",[])
 if not isinstance(answers,list): return jsonify({"error":"Answers must be a list"}),400
 details=[{"correct":i<len(answers) and answers[i]==q[2],"explanation":q[3]} for i,q in enumerate(QUIZ)]
 return jsonify({"score":sum(d["correct"] for d in details),"total":len(QUIZ),"details":details})
@app.route("/api/assistant",methods=["POST"])
def assistant():
 m=((request.get_json(silent=True) or {}).get("message") or "").lower()
 if "mandible" in m or "jaw" in m: r="The mandible is the lower jaw bone and supports the lower teeth."
 elif "enamel" in m or "tooth" in m: r="Enamel covers the crown, dentin forms most of the tooth, cementum covers the root, and pulp contains vessels and nerves."
 elif "trigeminal" in m or "nerve" in m: r="The trigeminal nerve (CN V) has ophthalmic (V1), maxillary (V2), and mandibular (V3) divisions."
 elif "periodontium" in m or "gum" in m: r="The periodontium includes gingiva, periodontal ligament, cementum, and alveolar bone."
 else: r="Ask me about skull bones, oral anatomy, tooth structure, the periodontium, histology, or the trigeminal nerve."
 return jsonify({"reply":r,"mode":"prepared educational responses"})
@app.route("/health")
def health(): return jsonify({"status":"ok","app":"MediLearn"})
if __name__=="__main__": app.run(host="0.0.0.0",port=int(os.environ.get("PORT",5000)),debug=False)
