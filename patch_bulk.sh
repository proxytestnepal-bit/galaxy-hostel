cat components/roles/AdminView.tsx | awk '
/if \(!window.confirm\(\`Are you sure you want to apply these Full\/Pass marks to/ {
    print "    setConfirmDialog({"
    print "      isOpen: true,"
    print "      title: \"Confirm Bulk Update\","
    print "      message: \`Are you sure you want to apply these Full/Pass marks to ${targetsText} of Class ${examEditClassId} for ${examEditSubject}?\`,"
    print "      type: \"warning\","
    print "      onConfirm: () => {"
    print "        const selectedSubjectData = state.availableSubjects.find(s => s.name === examEditSubject);"
    print "        const effectiveType = selectedSubjectData?.classTypes?.[examEditClassId] || selectedSubjectData?.type || \"Theory\";"
    print "        const hasPractical = effectiveType === \"Practical\" || effectiveType === \"Both\";"
    print "        dispatch({"
    print "          type: \"UPDATE_EXAM_CONFIG\","
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
    print "        showToast(\`Marks configuration saved for Class ${examEditClassId} ${examEditSubject}.\`);"
    print "      }"
    print "    });"
    print "  };"
    
    in_func = 1
    next
}
in_func == 1 && /showToast\(/ {
    in_func = 0
    next
}
in_func == 1 && /^  \};/ {
    in_func = 0
    next
}
in_func == 1 {
    next
}
{ print }
' > tmp_admin.tsx && mv tmp_admin.tsx components/roles/AdminView.tsx
