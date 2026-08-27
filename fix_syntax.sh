cat components/roles/AdminView.tsx | awk '
NR==520,NR==535 {
    if (NR == 520) {
        print "          payload: {"
        print "            id: \"\","
        print "            examSessionId: selectedExamSessionId,"
        print "            classId: examEditClassId,"
        print "            subject: examEditSubject,"
        print "            fullMarks: examEditFullMarks,"
        print "            passMarks: examEditPassMarks,"
        print "            practicalFullMarks: hasPractical ? examEditPracticalFullMarks : undefined,"
        print "            practicalPassMarks: hasPractical ? examEditPracticalPassMarks : undefined"
        print "          }"
        print "        });"
        print "        showToast(`Marks configuration saved for Class ${examEditClassId} ${examEditSubject}.`);"
        print "      }"
        print "    });"
        print "  };"
    }
    next
}
{ print }
' > tmp_admin.tsx && mv tmp_admin.tsx components/roles/AdminView.tsx
